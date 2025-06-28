import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useRecommendations } from "@/hooks/useRecommendations";

export default function RecommandationsBox({ filter }) {
  const { recommendations, loading, refresh } = useRecommendations();
  const items = filter
    ? recommendations.filter(r => r.category === filter)
    : recommendations;

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        <LoadingSpinner message="Chargement..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">Aucune recommandation</div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((rec, idx) => (
        <div
          key={idx}
          onClick={() => rec.onClick?.(rec) || refresh()}
          className="flex items-center gap-2 bg-glass border border-borderGlass backdrop-blur rounded-lg p-2 shadow cursor-pointer hover:bg-white/20 text-sm"
        >
          <span>{rec.type === 'alert' ? '🔍' : '🧠'}</span>
          <span className="flex-1">{rec.message}</span>
        </div>
      ))}
    </div>
  );
}
