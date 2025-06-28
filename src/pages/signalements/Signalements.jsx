import { useSignalements } from "@/hooks/useSignalements";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

export default function Signalements() {
  const { loading: authLoading } = useAuth();
  const { data: signalements, loading, error } = useSignalements();

  if (loading || authLoading) {
    return (
      <div className="p-6 text-center">
        <LoadingSpinner message="Chargement des signalements..." />
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
      <h1 className="text-3xl font-bold mb-4 text-mamastock-gold">Signalements</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {signalements.map((sig) => (
          <GlassCard key={sig.id} className="p-4">
            <h2 className="text-lg font-semibold">{sig.titre}</h2>
            <p className="text-sm text-gray-300">
              {sig.commentaire || "Sans commentaire"}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
