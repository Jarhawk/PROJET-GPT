// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { usePromotions } from "@/hooks/usePromotions";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster, toast } from "react-hot-toast";

export default function Promotions() {
  const { promotions, fetchPromotions, addPromotion, updatePromotion, deletePromotion } = usePromotions();
  const { mama_id, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && mama_id) fetchPromotions();
  }, [authLoading, mama_id, fetchPromotions]);

  if (authLoading || !mama_id) return null;

  const filtered = promotions.filter(p =>
    !search || p.nom.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async id => {
    if (window.confirm("Supprimer cette promotion ?")) {
      await deletePromotion(id);
      toast.success("Promotion supprimée");
    }
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <div className="flex gap-4 mb-4 items-center">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          placeholder="Recherche promotion"
        />
        <Button onClick={() => setShowForm(true)}>Nouvelle promotion</Button>
      </div>
      <TableContainer className="mt-2">
        <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Début</th>
            <th className="px-4 py-2">Fin</th>
            <th className="px-4 py-2">Active</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-1 font-semibold text-mamastockGold">{p.nom}</td>
              <td className="px-4 py-1">{p.date_debut}</td>
              <td className="px-4 py-1">{p.date_fin || "-"}</td>
              <td className="px-4 py-1">{p.actif ? "Oui" : "Non"}</td>
              <td className="px-4 py-1 text-right">
                <Button size="sm" variant="outline" className="mr-2" onClick={() => { setEditRow(p); setShowForm(true); }}>
                  Modifier
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                  Supprimer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </TableContainer>
      {showForm && (
        <PromotionForm
          promotion={editRow}
          saving={saving}
          onClose={() => { setShowForm(false); setEditRow(null); }}
          onSave={async values => {
            try {
              setSaving(true);
              if (editRow) {
                await updatePromotion(editRow.id, values);
                toast.success("Promotion modifiée !");
              } else {
                await addPromotion(values);
                toast.success("Promotion ajoutée !");
              }
              setShowForm(false);
              setEditRow(null);
              fetchPromotions();
            } catch (err) {
              console.error("Erreur enregistrement promotion:", err);
              toast.error("Erreur lors de l'enregistrement.");
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

function PromotionForm({ promotion = {}, onClose, onSave, saving }) {
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
