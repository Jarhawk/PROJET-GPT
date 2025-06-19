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
    setLoading(true);
    try {
      await addMouvementStock({
        product_id: produit?.id,
        type,
        quantite: Number(quantite),
        zone,
        motif,
      });
      toast.success("Mouvement enregistré !");
      onClose?.();
    } catch {
      toast.error("Erreur lors de l’enregistrement.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Mouvement de stock</h2>
      <div className="mb-2">Produit : <b>{produit?.nom}</b></div>
      <label htmlFor="type" className="sr-only">Type</label>
      <select
        id="type"
        className="input mb-2"
        value={type}
        onChange={e => setType(e.target.value)}
        required
      >
        <option value="entree">Entrée (réception, retour…)</option>
        <option value="sortie">Sortie (perte, conso, correction…)</option>
      </select>
      <label htmlFor="quantite" className="sr-only">Quantité</label>
      <input
        id="quantite"
        className="input mb-2"
        type="number"
        step="0.01"
        value={quantite}
        onChange={e => setQuantite(e.target.value)}
        placeholder="Quantité"
        required
      />
      <label htmlFor="zone" className="sr-only">Zone</label>
      <input
        id="zone"
        className="input mb-2"
        value={zone}
        onChange={e => setZone(e.target.value)}
        placeholder="Zone (frigo, cave, etc.)"
      />
      <label htmlFor="motif" className="sr-only">Motif</label>
      <input
        id="motif"
        className="input mb-2"
        value={motif}
        onChange={e => setMotif(e.target.value)}
        placeholder="Motif (optionnel)"
      />
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>Valider</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
