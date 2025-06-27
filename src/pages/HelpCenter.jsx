import { useEffect } from "react";
import { useHelpArticles } from "@/hooks/useHelpArticles";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function HelpCenter() {
  const { mama_id } = useAuth();
  const { items, fetchArticles, loading, error } = useHelpArticles();

  useEffect(() => {
    if (mama_id) fetchArticles();
  }, [fetchArticles, mama_id]);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Aide & FAQ</h1>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="bg-white/40 rounded-lg p-4 shadow">
            <h2 className="font-semibold text-lg mb-2">{a.title}</h2>
            <p className="whitespace-pre-line text-sm">{a.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
