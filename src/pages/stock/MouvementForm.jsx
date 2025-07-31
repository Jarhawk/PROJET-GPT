// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useStock } from "@/hooks/useStock";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import GlassCard from "@/components/ui/GlassCard";

export default function MouvementForm({ onClose }) {
  const { createMouvement } = useStock();
  const [form, setForm] = useState({ produit_id: "", quantite: 0, type: "entree", commentaire: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      <GlassCard title="Nouveau mouvement" className="w-80">
        <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="input mb-2 w-full"
          placeholder="Produit ID"
          value={form.produit_id}
          onChange={(e) => setForm({ ...form, produit_id: e.target.value })}
        />
        <input
          className="input mb-2 w-full"
          type="number"
          step="0.01"
          placeholder="Quantité"
          value={form.quantite}
          onChange={(e) => setForm({ ...form, quantite: parseFloat(e.target.value) })}
        />
        <select
          className="input mb-2 w-full"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="entree">Entrée</option>
          <option value="sortie">Sortie</option>
          <option value="transfert">Transfert</option>
        </select>
        <textarea
          className="input mb-2 w-full"
          rows={2}
          placeholder="Commentaire"
          value={form.commentaire}
          onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
        />
        <div className="flex gap-2 justify-end mt-4">
          <Button type="submit" disabled={loading}>Valider</Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
        </div>
        </form>
      </GlassCard>
    </div>
  );
}
