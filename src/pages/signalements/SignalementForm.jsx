// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useSignalements } from "@/hooks/useSignalements";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
import GlassCard from "@/components/ui/GlassCard";

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
    <GlassCard title="Nouveau signalement" className="mb-4">
      <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder="Titre"
        className="input w-full"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
      />
      <textarea
        placeholder="Description"
        className="input w-full"
        rows={3}
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
      />
      <select
        value={statut}
        onChange={(e) => setStatut(e.target.value)}
        className="input w-full"
      >
        <option value="ouvert">Ouvert</option>
        <option value="en cours">En cours</option>
        <option value="résolu">Résolu</option>
      </select>
      <button
        type="submit"
        disabled={authLoading || submitting}
        className="w-full py-2 bg-white/30 text-white font-semibold rounded-md hover:bg-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/60 disabled:opacity-50"
      >
        Ajouter
      </button>
      </form>
    </GlassCard>
  );
}
