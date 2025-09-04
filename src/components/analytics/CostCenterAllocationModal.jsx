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

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [allocs] = await Promise.all([
          fetchCostCenters(),
          fetchAllocations(mouvementId).then((data) => {
            return data.map((a) => ({
              cost_center_id: a.cost_center_id,
              quantite: a.quantite,
              valeur: a.valeur,
            }));
          }),
          fetchSuggestions(produitId),
        ]);
        setRows(allocs);
      } catch (err) {
        console.error('Erreur chargement ventilation:', err);
        toast.error('Erreur de chargement');
      }
    })();
  }, [open, mouvementId, produitId]);

  const handleAdd = () =>
    setRows((r) => [
      ...r,
      { cost_center_id: costCenters[0]?.id || '', quantite: 0, valeur: 0 },
    ]);

  const handleChange = (idx, field, value) => {
    setRows((r) =>
      r.map((row, i) =>
        i === idx
          ? {
              ...row,
              [field]:
                field === 'quantite'
                  ? Number(value) || 0
                  : field === 'valeur'
                    ? value === ''
                      ? null
                      : Number(value)
                    : value,
            }
          : row
      )
    );
  };

  const handleRemove = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      await saveAllocations(mouvementId, rows);
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
        {suggestions.length > 0 && (
          <div className="text-xs mb-2 p-2 bg-white/10 border border-white/20 backdrop-blur-xl rounded">
            Suggestions:
            <ul className="list-disc list-inside">
              {suggestions.map((s) => (
                <li key={s.cost_center_id}>
                  {s.nom} {(s.ratio * 100).toFixed(0)}%
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="sm"
              className="mt-1"
              variant="ghost"
              onClick={() => {
                setRows(
                  suggestions.map((s) => ({
                    cost_center_id: s.cost_center_id,
                    quantite: 0,
                    valeur: 0,
                  }))
                );
              }}
            >
              Appliquer
            </Button>
          </div>
        )}
        {rows.map((row, idx) => (
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
              {costCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
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
        ))}
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
