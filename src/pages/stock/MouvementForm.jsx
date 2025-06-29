// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useStock } from "@/hooks/useStock";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function MouvementForm({ onClose }) {
  const { createMouvement } = useStock();
  const [form, setForm] = useState({ product_id: "", quantite: 0, type: "entree", commentaire: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-glass border border-borderGlass backdrop-blur p-6 rounded-2xl shadow-lg w-80"
      >
        <h2 className="font-bold mb-2">Nouveau mouvement</h2>
        <input
          className="input mb-2 w-full"
          placeholder="Produit ID"
          value={form.product_id}
          onChange={(e) => setForm({ ...form, product_id: e.target.value })}
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
    </div>
  );
}
