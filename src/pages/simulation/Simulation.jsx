// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useSignalements } from "@/hooks/useSignalements";
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

export default function Simulation() {
  const { loading: authLoading } = useAuth();
  const { data: signalements, loading, error } = useSignalements();

  if (loading || authLoading) {
    return <LoadingSpinner message="Chargement des signalements..." />;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 text-center">
        ❌ Erreur lors du chargement : {error.message}
      </div>
    );
  }

  const list = Array.isArray(signalements) ? signalements : [];

  if (list.length === 0) {
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
        {(() => {
          const cards = [];
          for (let i = 0; i < list.length; i++) {
            const sig = list[i];
            cards.push(
              <GlassCard key={sig.id} className="p-4">
                <h2 className="text-lg font-semibold">{sig.titre}</h2>
                <p className="text-sm text-gray-300">
                  {sig.commentaire || "Sans commentaire"}
                </p>
              </GlassCard>
            );
          }
          return cards;
        })()}
      </div>
    </div>
  );
}
