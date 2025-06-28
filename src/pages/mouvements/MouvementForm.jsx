import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useMouvements } from "@/hooks/useMouvements";
import { useProducts } from "@/hooks/useProducts";
import toast from "react-hot-toast";

export default function MouvementForm({ onClose }) {
  const { createMouvement } = useMouvements();
  const { products, fetchProducts } = useProducts();
  const [produitInput, setProduitInput] = useState("");
  const [form, setForm] = useState({
    type: "entrée",
    product_id: "",
    quantite: 0,
    zone: "",
    motif: "",
    sous_type: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts({ limit: 1000 });
  }, [fetchProducts]);


  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    if (!form.product_id || !form.quantite) {
      toast.error("Produit et quantité requis");
      return;
    }
    try {
      setLoading(true);
      const { error } = await createMouvement(form);
      if (error) throw error;
      toast.success("Mouvement enregistré !");
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleProduitChange = val => {
    setProduitInput(val);
    const found = products.find(p => p.nom === val);
    setForm(f => ({ ...f, product_id: found ? found.id : "" }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-80 text-black">
        <h2 className="font-bold mb-2">Nouveau mouvement</h2>
        <select
          className="input mb-2 w-full"
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        >
          <option value="entrée">Entrée</option>
          <option value="sortie">Sortie</option>
          <option value="transfert">Transfert</option>
          <option value="inventaire">Ajustement</option>
        </select>
        <div className="mb-2">
          <input
            className="input w-full"
            list="liste-produits"
            value={produitInput}
            onChange={e => handleProduitChange(e.target.value)}
            placeholder="Produit"
          />
          <datalist id="liste-produits">
            {products.map(p => (
              <option key={p.id} value={p.nom} />
            ))}
          </datalist>
        </div>
        <input
          className="input mb-2 w-full"
          type="number"
          step="0.01"
          placeholder="Quantité"
          value={form.quantite}
          onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
        />
        <input
          className="input mb-2 w-full"
          placeholder="Zone"
          value={form.zone}
          onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
        />
        <input
          className="input mb-2 w-full"
          placeholder="Sous-type (optionnel)"
          value={form.sous_type}
          onChange={e => setForm(f => ({ ...f, sous_type: e.target.value }))}
        />
        <input
          className="input mb-2 w-full"
          placeholder="Motif"
          value={form.motif}
          onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
        />
        <div className="flex gap-2 justify-end mt-4">
          <Button type="submit" disabled={loading}>Valider</Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
