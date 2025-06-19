import { useEffect, useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Toaster, toast } from "react-hot-toast";

export default function Alertes() {
  const { rules, fetchRules, addRule, deleteRule } = useAlerts();
  const { products, fetchProducts } = useProducts();
  const [form, setForm] = useState({ product_id: "", threshold: "" });

  useEffect(() => {
    fetchRules();
    fetchProducts({ limit: 200 });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addRule({ ...form, threshold: Number(form.threshold) });
    toast.success("Règle ajoutée");
    setForm({ product_id: "", threshold: "" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette règle ?")) {
      await deleteRule(id);
      toast.success("Règle supprimée");
    }
  };

  return (
    <div className="p-6 container mx-auto text-sm">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Alertes avancées</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-end">
        <label className="sr-only" htmlFor="alert-product">Produit</label>
        <Select
          id="alert-product"
          value={form.product_id}
          onChange={(e) => setForm(f => ({ ...f, product_id: e.target.value }))}
          className="w-64"
        >
          <option value="">-- Produit --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="alert-threshold">Seuil</label>
        <input
          id="alert-threshold"
          type="number"
          className="input w-32"
          placeholder="Seuil"
          value={form.threshold}
          onChange={(e) => setForm(f => ({ ...f, threshold: e.target.value }))}
          required
        />
        <Button type="submit">Ajouter</Button>
      </form>
      <table className="min-w-full bg-white rounded-xl shadow-md">
        <caption className="sr-only">Règles d'alerte configurées</caption>
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
        </tbody>
      </table>
    </div>
  );
}
