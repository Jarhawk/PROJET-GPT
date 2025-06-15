import { useEffect, useState } from "react";
import { usePertes } from "@/hooks/usePertes";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

export default function Pertes() {
  const { pertes, fetchPertes, addPerte, deletePerte } = usePertes();
  const { products, fetchProducts } = useProducts();
  const [form, setForm] = useState({ product_id: "", quantite: 0, motif: "", date_perte: "" });

  useEffect(() => {
    fetchPertes();
    fetchProducts();
  }, [fetchPertes, fetchProducts]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    await addPerte(form);
    setForm({ product_id: "", quantite: 0, motif: "", date_perte: "" });
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Pertes / Casses / Dons</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap">
        <select name="product_id" className="input" value={form.product_id} onChange={handleChange} required>
          <option value="">Produit…</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>
        <input type="number" name="quantite" className="input w-24" value={form.quantite}
               onChange={handleChange} placeholder="Quantité" required />
        <input type="date" name="date_perte" className="input" value={form.date_perte}
               onChange={handleChange} />
        <input name="motif" className="input flex-1" placeholder="Motif" value={form.motif} onChange={handleChange} />
        <Button type="submit">Ajouter</Button>
      </form>
      <table className="min-w-full text-xs bg-white rounded-xl shadow-md">
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
              <td className="px-2 py-1">{p.produit?.nom || p.product_id}</td>
              <td className="px-2 py-1 text-right">{Number(p.quantite).toLocaleString()}</td>
              <td className="px-2 py-1">{p.motif}</td>
              <td className="px-2 py-1">
                <Button variant="ghost" size="sm" onClick={() => deletePerte(p.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
