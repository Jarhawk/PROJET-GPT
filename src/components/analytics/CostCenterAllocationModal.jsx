import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogOverlay } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { useCostCenters } from "@/hooks/useCostCenters";
import { useMouvementCostCenters } from "@/hooks/useMouvementCostCenters";
import { useCostCenterSuggestions } from "@/hooks/useCostCenterSuggestions";

export default function CostCenterAllocationModal({ mouvementId, productId, open, onOpenChange }) {
  const { costCenters, fetchCostCenters } = useCostCenters();
  const { fetchAllocations, saveAllocations } = useMouvementCostCenters();
  const { suggestions, fetchSuggestions } = useCostCenterSuggestions();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (open) {
      fetchCostCenters();
      fetchAllocations(mouvementId).then(data => {
        setRows(data.map(a => ({ cost_center_id: a.cost_center_id, quantite: a.quantite, valeur: a.valeur })));
      });
      fetchSuggestions(productId);
    }
  }, [open, mouvementId, productId]);

  const handleAdd = () => setRows(r => [...r, { cost_center_id: costCenters[0]?.id || "", quantite: 0, valeur: 0 }]);

  const handleChange = (idx, field, value) => {
    setRows(r => r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const handleRemove = idx => setRows(r => r.filter((_, i) => i !== idx));

  const handleSubmit = async e => {
    e.preventDefault();
    await saveAllocations(mouvementId, rows);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 bg-black/40" />
      <DialogContent className="glass-liquid rounded-xl p-6 max-w-lg">
        <h3 className="font-bold mb-4 text-lg">Ventilation cost centers</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          {suggestions.length > 0 && (
            <div className="text-xs mb-2 p-2 bg-gray-50 rounded">
              Suggestions:
              <ul className="list-disc list-inside">
                {suggestions.map(s => (
                  <li key={s.cost_center_id}>{s.nom} {(s.ratio * 100).toFixed(0)}%</li>
                ))}
              </ul>
              <Button type="button" size="sm" className="mt-1" variant="ghost" onClick={() => {
                setRows(suggestions.map(s => ({ cost_center_id: s.cost_center_id, quantite: 0, valeur: 0 })));
              }}>Appliquer</Button>
            </div>
          )}
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                className="input"
                value={row.cost_center_id}
                onChange={e => handleChange(idx, "cost_center_id", e.target.value)}
              >
                {costCenters.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
              <input
                type="number"
                className="input w-24"
                value={row.quantite}
                onChange={e => handleChange(idx, "quantite", e.target.value)}
                placeholder="Quantité"
              />
              <input
                type="number"
                className="input w-24"
                value={row.valeur ?? ""}
                onChange={e => handleChange(idx, "valeur", e.target.value)}
                placeholder="Valeur €"
              />
              <Button variant="ghost" type="button" onClick={() => handleRemove(idx)}>✕</Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAdd}>+ Ajouter</Button>
          <div className="mt-4 flex gap-2">
            <Button type="submit">Enregistrer</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
