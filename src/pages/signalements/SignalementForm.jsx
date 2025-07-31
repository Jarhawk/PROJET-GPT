// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useSignalements } from "@/hooks/useSignalements";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
import GlassCard from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
      <Input
        type="text"
        placeholder="Titre"
        className="w-full"
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
      <Select
        value={statut}
        onChange={(e) => setStatut(e.target.value)}
        className="w-full"
      >
        <option value="ouvert">Ouvert</option>
        <option value="en cours">En cours</option>
        <option value="résolu">Résolu</option>
      </Select>
      <Button type="submit" className="w-full" disabled={authLoading || submitting}>
        Ajouter
      </Button>
      </form>
    </GlassCard>
  );
}
