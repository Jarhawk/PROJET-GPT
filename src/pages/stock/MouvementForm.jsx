import { useState } from "react";
import { useStock } from "@/hooks/useStock";
import { Button } from "@/components/ui/button";

export default function MouvementForm({ onClose }) {
  const { createMouvement } = useStock();
  const [form, setForm] = useState({ product_id: "", quantite: 0, type: "entree", commentaire: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createMouvement(form);
    setLoading(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-80">
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
