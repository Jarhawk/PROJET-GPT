import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignalementForm({ onCreated }) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [statut, setStatut] = useState("ouvert");

  const handleSubmit = async () => {
    const { error } = await supabase.from("signalements").insert([
      { titre, description, statut }
    ]);
    if (!error) {
      setTitre("");
      setDescription("");
      setStatut("ouvert");
      onCreated?.();
    }
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
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
