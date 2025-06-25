import { useState, useEffect } from "react";
// ✅ Vérifié
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
    produit_id: "",
    quantite: 0,
    zone_origine: "",
    zone_destination: "",
    prix_unitaire: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts({ limit: 1000 });
  }, [fetchProducts]);

  const valeur = Number(form.quantite) * Number(form.prix_unitaire);

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    if (!form.produit_id || !form.quantite) {
      toast.error("Produit et quantité requis");
      return;
    }
    console.log("DEBUG form", form);
    try {
      setLoading(true);
      const { error } = await createMouvement(form);
      if (error) throw error;
      toast.success("Mouvement enregistré !");
      onClose?.();
    } catch (err) {
      console.log("DEBUG error", err);
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleProduitChange = val => {
    setProduitInput(val);
    const found = products.find(p => p.nom === val);
    setForm(f => ({ ...f, produit_id: found ? found.id : "" }));
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
        {(form.type === "sortie" || form.type === "transfert") && (
          <input
            className="input mb-2 w-full"
            placeholder="Zone d'origine"
            value={form.zone_origine}
            onChange={e => setForm(f => ({ ...f, zone_origine: e.target.value }))}
          />
        )}
        {(form.type === "entrée" || form.type === "transfert" || form.type === "inventaire") && (
          <input
            className="input mb-2 w-full"
            placeholder="Zone de destination"
            value={form.zone_destination}
            onChange={e => setForm(f => ({ ...f, zone_destination: e.target.value }))}
          />
        )}
        {(form.type === "entrée" || form.type === "sortie") && (
          <input
            className="input mb-2 w-full"
            type="number"
            step="0.01"
            placeholder="Prix unitaire"
            value={form.prix_unitaire}
            onChange={e => setForm(f => ({ ...f, prix_unitaire: e.target.value }))}
          />
        )}
        <div className="mb-2 text-right text-sm">Valeur : {valeur.toFixed(2)}</div>
        <div className="flex gap-2 justify-end mt-4">
          <Button type="submit" disabled={loading}>Valider</Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
