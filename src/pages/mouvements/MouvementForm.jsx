// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
import { useMouvements } from "@/hooks/useMouvements";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import AutoCompleteZoneField from "@/components/ui/AutoCompleteZoneField";
import toast from "react-hot-toast";

export default function MouvementForm({ onClose }) {
  const { createMouvement } = useMouvements();
  const { products, fetchProducts } = useProducts();
  const { zones, fetchZones } = useZones();
  const [produitInput, setProduitInput] = useState("");
  const [form, setForm] = useState({
    type: "entrée",
    produit_id: "",
    quantite: 0,
    zone_source_id: "",
    zone_destination_id: "",
    commentaire: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts({ limit: 1000 });
    fetchZones();
  }, [fetchProducts, fetchZones]);


  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    if (!form.produit_id || !form.quantite) {
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
    setForm(f => ({ ...f, produit_id: found ? found.id : "" }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
      <GlassCard title="Nouveau mouvement" className="w-80">
        <form onSubmit={handleSubmit} className="space-y-2">
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
          <Input
            list="liste-produits"
            className="w-full"
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
        <Input
          className="mb-2 w-full"
          type="number"
          step="0.01"
          placeholder="Quantité"
          value={form.quantite}
          onChange={e => setForm(f => ({ ...f, quantite: parseFloat(e.target.value) }))}
        />
        {form.type !== "entrée" && (
          <AutoCompleteZoneField
            placeholder="Zone source"
            value={zones.find(z => z.id === form.zone_source_id)?.nom || ""}
            onChange={val => {
              const found = zones.find(z => z.nom === val);
              setForm(f => ({ ...f, zone_source_id: found ? found.id : "" }));
            }}
          />
        )}
        {form.type !== "sortie" && form.type !== "correction" && (
          <AutoCompleteZoneField
            placeholder="Zone destination"
            value={zones.find(z => z.id === form.zone_destination_id)?.nom || ""}
            onChange={val => {
              const found = zones.find(z => z.nom === val);
              setForm(f => ({ ...f, zone_destination_id: found ? found.id : "" }));
            }}
          />
        )}
        <textarea
          className="input mb-2 w-full"
          placeholder="Commentaire"
          value={form.commentaire}
          onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
        />
        <div className="flex gap-2 justify-end mt-4">
          <PrimaryButton type="submit" disabled={loading}>
            Valider
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose} disabled={loading}>
            Annuler
          </SecondaryButton>
        </div>
        </form>
      </GlassCard>
    </div>
  );
}
