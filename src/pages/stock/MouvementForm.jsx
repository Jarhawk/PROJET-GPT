// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import { useMouvements } from "@/hooks/useMouvements";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import toast from "react-hot-toast";

export default function MouvementForm({ onClose }) {
  const { createMouvement } = useMouvements();
  const { products, fetchProducts } = useProducts();
  const { zones, fetchZones } = useZones();
  const [form, setForm] = useState({
    produit_id: "",
    type: "entree_manuelle",
    quantite: 0,
    zone_id: "",
    motif: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts({ limit: 1000 });
    fetchZones();
  }, [fetchProducts, fetchZones]);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <GlassCard title="Nouveau mouvement" className="w-96">
        <form onSubmit={handleSubmit} className="space-y-2" aria-label="mouvement-form">
          <label className="block text-sm font-medium">
            Produit
            <select
              aria-label="Produit"
              className="input w-full"
              value={form.produit_id}
              onChange={e => handleChange("produit_id", e.target.value)}
            >
              <option value="">Sélectionner</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Type
            <select
              aria-label="Type"
              className="input w-full"
              value={form.type}
              onChange={e => handleChange("type", e.target.value)}
            >
              <option value="entree_manuelle">Entrée manuelle</option>
              <option value="sortie_manuelle">Sortie manuelle</option>
              <option value="ajustement">Ajustement</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Quantité
            <input
              aria-label="Quantité"
              type="number"
              step="0.01"
              className="input w-full"
              value={form.quantite}
              onChange={e => handleChange("quantite", parseFloat(e.target.value))}
            />
          </label>
          {zones.length > 0 && (
            <label className="block text-sm font-medium">
              Zone
              <select
                aria-label="Zone"
                className="input w-full"
                value={form.zone_id}
                onChange={e => handleChange("zone_id", e.target.value)}
              >
                <option value="">Aucune</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.nom}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm font-medium">
            Motif
            <textarea
              aria-label="Motif"
              className="input w-full"
              rows={2}
              value={form.motif}
              onChange={e => handleChange("motif", e.target.value)}
            />
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="submit" disabled={loading}>Valider</Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
