import { useState } from "react";
import { useStock } from "@/hooks/useStock";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function StockMouvementForm({ produit, onClose }) {
  const { addMouvementStock } = useStock();
  const [type, setType] = useState("entree");
  const [quantite, setQuantite] = useState(0);
  const [motif, setMotif] = useState("");
  const [zone, setZone] = useState(produit?.zone || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!quantite || Number(quantite) <= 0) {
      toast.error("Quantité invalide");
      return;
    }
    setLoading(true);
    const payload = {
      product_id: produit?.id,
      type,
      quantite: Number(quantite),
      zone,
      motif,
    };
    try {
      const res = await addMouvementStock(payload);
      if (res?.error) throw res.error;
      toast.success("Mouvement enregistré !");
      onClose?.();
    } catch (err) {
      console.error("Erreur mouvement stock:", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Mouvement de stock</h2>
      <div className="mb-2">Produit : <b>{produit?.nom}</b></div>
      <select
        className="input mb-2"
        value={type}
        onChange={e => setType(e.target.value)}
        required
      >
        <option value="entree">Entrée (réception, retour…)</option>
        <option value="sortie">Sortie (perte, conso, correction…)</option>
      </select>
      <input
        className="input mb-2"
        type="number"
        step="0.01"
        value={quantite}
        onChange={e => setQuantite(e.target.value)}
        placeholder="Quantité"
        required
      />
      <input
        className="input mb-2"
        value={zone}
        onChange={e => setZone(e.target.value)}
        placeholder="Zone (frigo, cave, etc.)"
      />
      <input
        className="input mb-2"
        value={motif}
        onChange={e => setMotif(e.target.value)}
        placeholder="Motif (optionnel)"
      />
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>Valider</Button>
        <Button variant="outline" type="button" onClick={onClose} disabled={loading}>Annuler</Button>
      </div>
    </form>
  );
}
