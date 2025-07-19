// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { usePromotions } from "@/hooks/usePromotions";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster, toast } from "react-hot-toast";
import PromotionForm from "./PromotionForm.jsx";

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
