// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { usePertes } from "@/hooks/usePertes";
import { useProducts } from "@/hooks/useProducts";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster, toast } from "react-hot-toast";

export default function Pertes() {
  const { mama_id } = useAuth();
  const { pertes, fetchPertes, addPerte, deletePerte } = usePertes();
  const { products, fetchProducts } = useProducts();
  const [form, setForm] = useState({ produit_id: "", quantite: 0, motif: "", date_perte: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mama_id) {
      fetchPertes();
      fetchProducts();
    }
  }, [fetchPertes, fetchProducts, mama_id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: name === "quantite" ? Number(value) : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.produit_id || !form.quantite) {
      toast.error("Produit et quantité requis !");
      return;
    }
    try {
      setSaving(true);
      await addPerte(form);
      toast.success("Perte enregistrée !");
      setForm({ produit_id: "", quantite: 0, motif: "", date_perte: "" });
    } catch (err) {
      console.error("Erreur ajout perte:", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Supprimer cette perte ?")) return;
    try {
      await deletePerte(id);
      toast.success("Perte supprimée.");
    } catch (err) {
      console.error("Erreur suppression perte:", err);
      toast.error("Échec suppression");
    }
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Pertes / Casses / Dons</h1>
      <GlassCard title="Nouvelle perte" className="mb-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
          <label className="sr-only" htmlFor="produit_id">Produit</label>
          <select
            id="produit_id"
            name="produit_id"
            className="form-input"
          value={form.produit_id}
          onChange={handleChange}
          required
        >
          <option value="">Produit…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
        <Input
          type="number"
          name="quantite"
          className="w-24"
          min={0}
          value={form.quantite}
          onChange={handleChange}
          placeholder="Quantité"
          required
        />
        <Input
          type="date"
          name="date_perte"
          value={form.date_perte}
          onChange={handleChange}
        />
        <Input
          name="motif"
          className="flex-1"
          placeholder="Motif"
          value={form.motif}
          onChange={handleChange}
        />
          <PrimaryButton type="submit" disabled={saving} className="h-10">
            {saving ? "Ajout..." : "Ajouter"}
          </PrimaryButton>
        </form>
      </GlassCard>
      <TableContainer className="mt-4">
        <table className="min-w-full text-xs">
          <thead>
          <tr>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Produit</th>
            <th className="px-2 py-1">Quantité</th>
            <th className="px-2 py-1">Motif</th>
            <th className="px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pertes.map(p => (
            <tr key={p.id}>
              <td className="px-2 py-1">{p.date_perte}</td>
              <td className="px-2 py-1">{p.produit?.nom || p.produit_id}</td>
              <td className="px-2 py-1 text-right">{Number(p.quantite).toLocaleString()}</td>
              <td className="px-2 py-1">{p.motif}</td>
              <td className="px-2 py-1">
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
