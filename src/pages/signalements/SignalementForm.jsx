// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useSignalements } from "@/hooks/useSignalements";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function SignalementForm({ onCreated }) {
  const { loading: authLoading } = useAuth();
  const { addSignalement } = useSignalements();
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authLoading || submitting) return;
    if (!type.trim()) {
      toast.error("Le type est requis.");
      return;
    }
    try {
      setSubmitting(true);
      await addSignalement({ type, description });
      toast.success("Signalement ajouté !");
      setType("");
      setDescription("");
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
        placeholder="Type"
        className="border px-2 py-1 w-full mb-2"
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      <textarea
        placeholder="Description"
        className="border px-2 py-1 w-full mb-2"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
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
