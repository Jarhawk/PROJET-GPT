// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanning } from "@/hooks/usePlanning";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster, toast } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import useAuth from "@/hooks/useAuth";
import Unauthorized from "@/pages/auth/Unauthorized";

export default function PlanningForm() {
  const navigate = useNavigate();
  const { createPlanning } = usePlanning();
  const { products, fetchProducts } = useProducts();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess("planning_previsionnel", "peut_modifier");
  const [nom, setNom] = useState("");
  const [date_prevue, setDatePrevue] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [statut, setStatut] = useState("prévu");
  const [lignes, setLignes] = useState([{ produit_id: "", quantite: 1, observation: "" }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mama_id) fetchProducts({ limit: 200 });
  }, [fetchProducts, mama_id]);

  if (authLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!canEdit) {
    return <Unauthorized />;
  }

  const updateLine = (idx, field, val) => {
    setLignes(l => l.map((li, i) => (i === idx ? { ...li, [field]: val } : li)));
  };
  const addLine = () => setLignes(l => [...l, { produit_id: "", quantite: 1, observation: "" }]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!date_prevue || !nom) {
      toast.error("Nom et date requis");
      return;
    }
    setLoading(true);
    const { error } = await createPlanning({ nom, date_prevue, commentaire, statut, lignes });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Planning enregistré");
      navigate("/planning");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold">Nouveau planning</h1>
      <div className="flex gap-4">
        <input className="input flex-1" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} required />
        <input type="date" className="input" value={date_prevue} onChange={e => setDatePrevue(e.target.value)} required />
        <select className="input" value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="prévu">Prévu</option>
          <option value="confirmé">Confirmé</option>
        </select>
      </div>
      <input className="input w-full" placeholder="Commentaire" value={commentaire} onChange={e => setCommentaire(e.target.value)} />
      <h2 className="font-semibold">Produits</h2>
      <TableContainer>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Produit</th>
              <th className="px-2 py-1 text-left">Quantité</th>
              <th className="px-2 py-1 text-left">Observation</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, idx) => (
              <tr key={idx}>
                <td className="px-2 py-1">
                  <select className="input" value={l.produit_id} onChange={e => updateLine(idx, "produit_id", e.target.value)} required>
                    <option value="">-- produit --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input type="number" min="0" className="input w-24" value={l.quantite} onChange={e => updateLine(idx, "quantite", e.target.value)} required />
                </td>
                <td className="px-2 py-1">
                  <input className="input" value={l.observation} onChange={e => updateLine(idx, "observation", e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      <Button type="button" variant="outline" onClick={addLine}>+ Ajouter une ligne</Button>
      <div className="text-right">
        <Button type="submit" disabled={loading}>Enregistrer</Button>
      </div>
      {loading && <LoadingSpinner message="Enregistrement..." />}
    </form>
  );
}
