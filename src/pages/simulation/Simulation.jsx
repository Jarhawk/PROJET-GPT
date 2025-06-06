import { useSignalements } from "@/hooks/useSignalements";

export default function Simulation() {
  const { data: signalements, loading, error } = useSignalements();

  if (loading) {
    return (
      <div className="p-6 text-white text-center">
        ⏳ Chargement des signalements...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 text-center">
        ❌ Erreur lors du chargement : {error.message}
      </div>
    );
  }

  if (!signalements || signalements.length === 0) {
    return (
      <div className="p-6 text-gray-300 text-center">
        📭 Aucun signalement disponible.
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-mamastock-gold">Simulation (test signalements)</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {signalements.map((sig) => (
          <div
            key={sig.id}
            className="bg-white/10 border border-mamastock-gold rounded-xl p-4 hover:bg-white/20 transition"
          >
            <h2 className="text-lg font-semibold">{sig.titre}</h2>
            <p className="text-sm text-gray-300">
              {sig.commentaire || "Sans commentaire"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
