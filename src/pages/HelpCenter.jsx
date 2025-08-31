// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from "react";
import { useHelpArticles } from "@/hooks/useHelpArticles";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

  export default function HelpCenter() {
    const { fetchArticles, items, loading, error } = useHelpArticles();

    useEffect(() => {
      fetchArticles();
    }, [fetchArticles]);

    const list = Array.isArray(items) ? items : [];
    const rows = [];
    for (const a of list) {
      rows.push(
        <li key={a.id} className="list-none">
          <GlassCard>
            <h2 className="font-semibold text-lg mb-2">{a.titre}</h2>
            <p className="whitespace-pre-line text-sm">{a.contenu}</p>
          </GlassCard>
        </li>
      );
    }

    return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Aide & FAQ</h1>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-500">{error}</div>}
        <ul className="space-y-4">{rows}</ul>
      </div>
    );
  }
