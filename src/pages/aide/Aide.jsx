// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { useAide } from '@/hooks/useAide';
import useAuth from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import AideForm from './AideForm.jsx';

export default function Aide() {
  const { access_rights, isSuperadmin, mama_id, loading: authLoading } = useAuth();
  const { items, fetchArticles, loading, error } = useAide();
  const [search, setSearch] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');
  const [pageFilter, setPageFilter] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchArticles({
        search,
        categorie: categorieFilter || undefined,
        lien_page: pageFilter || undefined,
      });
    }
  }, [authLoading, mama_id, search, categorieFilter, pageFilter, fetchArticles]);

  const categories = [...new Set(items.map((a) => a.categorie).filter(Boolean))];
  const pages = [...new Set(items.map((a) => a.lien_page).filter(Boolean))];
  const canEdit = isSuperadmin || access_rights?.aide?.peut_modifier;

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 space-y-6 container mx-auto">
      <h1 className="text-2xl font-bold">Aide</h1>
      <div className="flex flex-wrap gap-2 items-end">
        <input
          className="input"
          placeholder="Recherche"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={categorieFilter}
          onChange={(e) => setCategorieFilter(e.target.value)}
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={pageFilter}
          onChange={(e) => setPageFilter(e.target.value)}
        >
          <option value="">Toutes pages</option>
          {pages.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {canEdit && (
          <Button onClick={() => setEditing({})}>Nouvel article</Button>
        )}
      </div>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="list-none">
            <GlassCard>
              <h2 className="font-semibold text-lg mb-2">{a.titre}</h2>
              <p className="whitespace-pre-line text-sm mb-2">{a.contenu}</p>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                  Éditer
                </Button>
              )}
            </GlassCard>
          </li>
        ))}
      </ul>
      {editing && (
        <AideForm
          article={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchArticles({
              search,
              categorie: categorieFilter || undefined,
              lien_page: pageFilter || undefined,
            });
          }}
        />
      )}
    </div>
  );
}
