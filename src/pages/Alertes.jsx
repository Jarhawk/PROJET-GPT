import { useEffect, useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import TableContainer from "@/components/ui/TableContainer";
import { Search } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function Alertes() {
  const { rules, fetchRules, addRule, deleteRule } = useAlerts();
  const { products, fetchProducts } = useProducts();
  const { mama_id, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ product_id: "", threshold: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchRules({ search });
      fetchProducts({ limit: 200 });
    }
  }, [authLoading, mama_id, search, fetchRules, fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id) {
      toast.error("Produit requis");
      return;
    }
    try {
      await addRule({ ...form, threshold: Number(form.threshold) });
      toast.success("Règle ajoutée");
      await fetchRules({ search });
      setForm({ product_id: "", threshold: "" });
    } catch (err) {
      console.error("Erreur ajout règle:", err);
      toast.error("Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette règle ?")) {
      try {
        await deleteRule(id);
        toast.success("Règle supprimée");
        await fetchRules({ search });
      } catch (err) {
        console.error("Erreur suppression règle:", err);
        toast.error("Erreur lors de la suppression.");
      }
    }
  };


  return (
    <div className="p-6 container mx-auto text-sm">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Alertes avancées</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-end">
        <Select
          value={form.product_id}
          onChange={(e) => setForm(f => ({ ...f, product_id: e.target.value }))}
          className="w-64"
          required
        >
          <option value="">-- Produit --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </Select>
        <input
          type="number"
          className="input w-32"
          placeholder="Seuil"
          value={form.threshold}
          onChange={(e) => setForm(f => ({ ...f, threshold: e.target.value }))}
          required
        />
        <Button type="submit">Ajouter</Button>
      </form>
      <div className="relative w-64 mb-4">
        <input
          type="search"
          className="input w-full pl-8"
          placeholder="Recherche produit"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Search className="absolute left-2 top-2.5 text-white" size={18} />
      </div>
      <div className="mt-4">
        <TableContainer>
          <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1">Produit</th>
            <th className="px-2 py-1">Seuil</th>
            <th className="px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} className="border-t">
              <td className="px-2 py-1">
                {products.find(p => p.id === r.product_id)?.nom || r.product_id}
              </td>
              <td className="px-2 py-1">{r.threshold}</td>
              <td className="px-2 py-1 text-right">
                <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
                  Supprimer
                </Button>
              </td>
            </tr>
          ))}
          {rules.length === 0 && (
            <tr>
              <td colSpan={3} className="py-2 text-center text-gray-500">
                Aucun résultat trouvé.
              </td>
            </tr>
          )}
          </tbody>
        </table>
        </TableContainer>
      </div>
    </div>
  );
}
