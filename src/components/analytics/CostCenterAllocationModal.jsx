// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import ModalGlass from '@/components/ui/ModalGlass';
import { Button } from '@/components/ui/button';
import { useCostCenters } from '@/hooks/useCostCenters';
import { useMouvementCostCenters } from '@/hooks/useMouvementCostCenters';
import { useCostCenterSuggestions } from '@/hooks/useCostCenterSuggestions';
import { toast } from 'sonner';

export default function CostCenterAllocationModal({
  mouvementId,
  produitId,
  open,
  onOpenChange,
}) {
  const { costCenters, fetchCostCenters } = useCostCenters();
  const { fetchAllocations, saveAllocations } = useMouvementCostCenters();
  const { suggestions, fetchSuggestions } = useCostCenterSuggestions();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const centers = Array.isArray(costCenters) ? costCenters : [];
  const suggs = Array.isArray(suggestions) ? suggestions : [];
  const rowList = Array.isArray(rows) ? rows : [];

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [allocs] = await Promise.all([
          fetchAllocations(mouvementId).then((data) => {
            const src = Array.isArray(data) ? data : [];
            const mapped = [];
            for (const a of src) {
              mapped.push({
                cost_center_id: a.cost_center_id,
                quantite: a.quantite,
                valeur: a.valeur,
              });
            }
            return mapped;
          }),
          fetchCostCenters(),
          fetchSuggestions(produitId),
        ]);
        setRows(Array.isArray(allocs) ? allocs : []);
      } catch (err) {
        console.error('Erreur chargement ventilation:', err);
        toast.error('Erreur de chargement');
      }
    })();
  }, [open, mouvementId, produitId]);

  const handleAdd = () =>
    setRows((r) => {
      const arr = Array.isArray(r) ? r : [];
      return [
        ...arr,
        { cost_center_id: centers[0]?.id || '', quantite: 0, valeur: 0 },
      ];
    });

  const handleChange = (idx, field, value) => {
    setRows((r) => {
      const arr = Array.isArray(r) ? r : [];
      const next = [];
      for (let i = 0; i < arr.length; i++) {
        const row = arr[i];
        if (i === idx) {
          next.push({
            ...row,
            [field]:
              field === "quantite"
                ? Number(value) || 0
                : field === "valeur"
                  ? value === ""
                    ? null
                    : Number(value)
                  : value,
          });
        } else {
          next.push(row);
        }
      }
      return next;
    });
  };

  const handleRemove = (idx) =>
    setRows((r) => {
      const arr = Array.isArray(r) ? r : [];
      const next = [];
      for (let i = 0; i < arr.length; i++) {
        if (i !== idx) next.push(arr[i]);
      }
      return next;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      await saveAllocations(mouvementId, rowList);
      toast.success('Ventilation enregistrée');
      onOpenChange(false);
    } catch (err) {
      console.error('Erreur sauvegarde ventilation:', err);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalGlass open={open} onClose={() => onOpenChange(false)}>
      <h3 className="font-bold mb-4 text-lg">Ventilation centres de coûts</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        {suggs.length > 0 && (
          <div className="text-xs mb-2 p-2 bg-white/10 border border-white/20 backdrop-blur-xl rounded">
            Suggestions:
            <ul className="list-disc list-inside">
              {(() => {
                const items = Array.isArray(suggs) ? suggs : [];
                const lis = [];
                for (const s of items) {
                  lis.push(
                    <li key={s.cost_center_id}>
                      {s.nom} {(s.ratio * 100).toFixed(0)}%
                    </li>
                  );
                }
                return lis;
              })()}
            </ul>
            <Button
              type="button"
              size="sm"
              className="mt-1"
              variant="ghost"
              onClick={() => {
                const items = Array.isArray(suggs) ? suggs : [];
                const mapped = [];
                for (const s of items) {
                  mapped.push({
                    cost_center_id: s.cost_center_id,
                    quantite: 0,
                    valeur: 0,
                  });
                }
                setRows(mapped);
              }}
            >
              Appliquer
            </Button>
          </div>
        )}
        {(() => {
          const list = Array.isArray(rowList) ? rowList : [];
          const rows = [];
          const centerOptions = [];
          const centerList = Array.isArray(centers) ? centers : [];
          for (const c of centerList) {
            centerOptions.push(
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            );
          }
          for (let idx = 0; idx < list.length; idx++) {
            const row = list[idx];
            rows.push(
              <div key={idx} className="flex gap-2 items-center">
                <label className="sr-only" htmlFor={`cc-${idx}`}>
                  Centre de coût
                </label>
                <select
                  id={`cc-${idx}`}
                  className="form-input"
                  aria-label="Centre de coût"
                  value={row.cost_center_id}
                  onChange={(e) =>
                    handleChange(idx, 'cost_center_id', e.target.value)
                  }
                >
                  {centerOptions}
                </select>
                <label className="sr-only" htmlFor={`qt-${idx}`}>
                  Quantité
                </label>
                <input
                  id={`qt-${idx}`}
                  type="number"
                  className="form-input w-24"
                  aria-label="Quantité"
                  value={row.quantite}
                  onChange={(e) => handleChange(idx, 'quantite', e.target.value)}
                  placeholder="Quantité"
                />
                <label className="sr-only" htmlFor={`val-${idx}`}>
                  Valeur
                </label>
                <input
                  id={`val-${idx}`}
                  type="number"
                  className="form-input w-24"
                  aria-label="Valeur"
                  value={row.valeur ?? ''}
                  onChange={(e) => handleChange(idx, 'valeur', e.target.value)}
                  placeholder="Valeur €"
                />
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => handleRemove(idx)}
                >
                  ✕
                </Button>
              </div>
            );
          }
          return rows;
        })()}
        <Button type="button" variant="outline" onClick={handleAdd}>
          + Ajouter
        </Button>
        <div className="mt-4 flex gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving && <span className="loader-glass" />}Enregistrer
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
        </div>
      </form>
    </ModalGlass>
  );
}
