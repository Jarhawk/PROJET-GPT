// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useStock } from "@/hooks/useStock";
import { useZones } from "@/hooks/useZones";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";

export default function StockMouvementForm({ produit, onClose }) {
  const { addMouvementStock } = useStock();
  const { zones, fetchZones } = useZones();
  const [type, setType] = useState("entree");
  const [quantite, setQuantite] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [zoneSource, setZoneSource] = useState("");
  const [zoneDestination, setZoneDestination] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!quantite || Number(quantite) <= 0) {
      toast.error("Quantité invalide");
      return;
    }
    setLoading(true);
    const payload = {
      produit_id: produit?.id,
      type,
      quantite: Number(quantite),
      zone_source_id: zoneSource || null,
      zone_destination_id: zoneDestination || null,
      commentaire,
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
    <form
      onSubmit={handleSubmit}
      className="bg-glass border border-borderGlass backdrop-blur p-6 rounded-2xl shadow-lg max-w-md mx-auto"
    >
      <h2 className="text-lg font-bold mb-4">Mouvement de stock</h2>
      <div className="mb-2">Produit : <b>{produit?.nom}</b></div>
      <Select
        value={type}
        onChange={e => setType(e.target.value)}
        className="mb-2"
        required
      >
        <option value="entree">Entrée (réception, retour…)</option>
        <option value="sortie">Sortie (perte, conso, correction…)</option>
        <option value="transfert">Transfert</option>
      </Select>
      <Input
        className="mb-2"
        type="number"
        step="0.01"
        value={quantite}
        onChange={e => setQuantite(e.target.value)}
        placeholder="Quantité"
        required
      />
      {type === "sortie" && (
        <Select
          className="mb-2"
          value={zoneSource}
          onChange={e => setZoneSource(e.target.value)}
        >
          <option value="">Zone source</option>
          {zones.map(z => (
            <option key={z.id} value={z.id}>{z.nom}</option>
          ))}
        </Select>
      )}
      {type === "entree" && (
        <Select
          className="mb-2"
          value={zoneDestination}
          onChange={e => setZoneDestination(e.target.value)}
        >
          <option value="">Zone destination</option>
          {zones.map(z => (
            <option key={z.id} value={z.id}>{z.nom}</option>
          ))}
        </Select>
      )}
      {type === "transfert" && (
        <div className="flex gap-2 mb-2">
          <Select
            className="flex-1"
            value={zoneSource}
            onChange={e => setZoneSource(e.target.value)}
          >
            <option value="">Zone source</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.nom}</option>
            ))}
          </Select>
          <Select
            className="flex-1"
            value={zoneDestination}
            onChange={e => setZoneDestination(e.target.value)}
          >
            <option value="">Zone destination</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.nom}</option>
            ))}
          </Select>
        </div>
      )}
      <Input
        className="mb-2"
        value={commentaire}
        onChange={e => setCommentaire(e.target.value)}
        placeholder="Commentaire (optionnel)"
      />
      <div className="flex gap-2 mt-4">
        <PrimaryButton type="submit" disabled={loading} className="flex items-center gap-2">
          {loading && <span className="loader-glass" />}
          Valider
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onClose} disabled={loading}>Annuler</SecondaryButton>
      </div>
    </form>
  );
}
