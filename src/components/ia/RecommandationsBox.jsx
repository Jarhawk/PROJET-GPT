// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useRecommendations } from "@/hooks/useRecommendations";

export default function RecommandationsBox({ filter }) {
  const { recommendations, loading, refresh } = useRecommendations();
  const list = Array.isArray(recommendations) ? recommendations : [];
  const items = filter ? list.filter(r => r.category === filter) : list;

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
      {(function () {
        const nodes = [];
        const arr = Array.isArray(items) ? items : [];
        let idx = 0;
        for (const rec of arr) {
          nodes.push(
            <div
              key={idx}
              onClick={() => rec.onClick?.(rec) || refresh()}
              className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-xl rounded-lg p-2 shadow cursor-pointer hover:bg-white/20 text-sm"
            >
              <span>{rec.type === 'alert' ? '🔍' : '🧠'}</span>
              <span className="flex-1">{rec.message}</span>
            </div>
          );
          idx += 1;
        }
        return nodes;
      })()}
    </div>
  );
}
