import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PromotionForm({ promotion = {}, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    nom: promotion.nom || "",
    description: promotion.description || "",
    date_debut: promotion.date_debut || "",
    date_fin: promotion.date_fin || "",
    actif: promotion.actif ?? true,
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-glass border border-borderGlass backdrop-blur rounded-2xl p-6 shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">{promotion.id ? "Modifier" : "Nouvelle"} promotion</h2>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); onSave(form); }}>
          <div>
            <label className="block text-sm font-semibold">Nom</label>
            <input className="input w-full" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-semibold">Description</label>
            <textarea className="input w-full" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold">Début</label>
              <input type="date" className="input w-full" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold">Fin</label>
              <input type="date" className="input w-full" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} />
              <span>Active</span>
            </label>
          </div>
          <div className="flex gap-4 justify-end pt-2">
            <Button type="submit" disabled={saving}>Enregistrer</Button>
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
