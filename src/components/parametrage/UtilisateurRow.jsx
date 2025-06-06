// src/components/parametrage/UtilisateurRow.jsx
import { supabase } from "@/lib/supabase";

export default function UtilisateurRow({ utilisateur, refresh }) {
  const toggleActif = async () => {
    await supabase
      .from("users")
      .update({ actif: !utilisateur.actif })
      .eq("id", utilisateur.id);
    refresh();
  };

  return (
    <div className="bg-white/10 border border-white/20 p-4 rounded flex justify-between items-center">
      <div>
        <p className="font-semibold">{utilisateur.email}</p>
        <p className="text-sm text-gray-300">{utilisateur.role || "Sans rôle"}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={toggleActif}
          className={`px-3 py-1 rounded ${
            utilisateur.actif ? "bg-red-600" : "bg-green-600"
          } text-white`}
        >
          {utilisateur.actif ? "🛑 Désactiver" : "✅ Réactiver"}
        </button>
      </div>
    </div>
  );
}
