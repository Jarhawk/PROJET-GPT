import { useState } from "react";
import { useSignalements } from "@/hooks/useSignalements";
import { useAuth } from "@/context/AuthContext";

export default function SignalementForm({ onCreated }) {
  const { loading: authLoading } = useAuth();
  const { addSignalement } = useSignalements();
  const [titre, setTitre] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [statut, setStatut] = useState("ouvert");

  const handleSubmit = async () => {
    if (authLoading) return;
    await addSignalement({ titre, commentaire, statut });
    setTitre("");
    setCommentaire("");
    setStatut("ouvert");
    onCreated?.();
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
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
        onClick={handleSubmit}
        className="bg-mamastock-gold text-white px-4 py-2 rounded"
      >
        Ajouter
      </button>
    </div>
  );
}
