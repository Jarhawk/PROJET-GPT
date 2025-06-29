// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useSignalements } from "@/hooks/useSignalements";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function SignalementForm({ onCreated }) {
  const { loading: authLoading } = useAuth();
  const { addSignalement } = useSignalements();
  const [titre, setTitre] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [statut, setStatut] = useState("ouvert");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authLoading || submitting) return;
    if (!titre.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    try {
      setSubmitting(true);
      await addSignalement({ titre, commentaire, statut });
      toast.success("Signalement ajouté !");
      setTitre("");
      setCommentaire("");
      setStatut("ouvert");
      onCreated?.();
    } catch (err) {
      console.error("Erreur enregistrement signalement:", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-glass border border-borderGlass backdrop-blur p-4 rounded-2xl shadow-lg mb-4"
    >
      <h3 className="text-lg font-bold mb-2">Nouveau signalement</h3>
      <input
        type="text"
        placeholder="Titre"
        className="border px-2 py-1 w-full mb-2"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
      />
      <textarea
        placeholder="Description"
        className="border px-2 py-1 w-full mb-2"
        rows={3}
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
      />
      <select
        value={statut}
        onChange={(e) => setStatut(e.target.value)}
        className="border px-2 py-1 w-full mb-2"
      >
        <option value="ouvert">Ouvert</option>
        <option value="en cours">En cours</option>
        <option value="résolu">Résolu</option>
      </select>
      <button
        type="submit"
        disabled={authLoading || submitting}
        className="bg-mamastock-gold text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Ajouter
      </button>
    </form>
  );
}
