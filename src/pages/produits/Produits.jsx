// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { useProduits } from '@/hooks/data/useProduits';
import { useFamilles } from '@/hooks/data/useFamilles';
import { useSousFamilles } from '@/hooks/data/useSousFamilles';
import { useMamaSettings } from '@/hooks/useMamaSettings';
import { Button } from '@/components/ui/button';

export default function Produits() {
  const { mamaId } = useMamaSettings(); // ou autre source
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('tous'); // tous | actif | inactif
  const [familleId, setFamilleId] = useState(null);
  const [sousFamilleId, setSousFamilleId] = useState(null);
  const [page, setPage] = useState(1);

  const pageSize = 25;

  const { data: familles = [] } = useFamilles({ mamaId });
  const { data: sousFamillesAll = [] } = useSousFamilles({ mamaId });
  const sousFamillesOptions = familleId
    ? sousFamillesAll.filter((sf) => sf.famille_id === familleId)
    : sousFamillesAll;

  const { data, isLoading, error } = useProduits({
    search,
    statut,
    familleId,
    sousFamilleId,
    page,
    pageSize,
  });

  const rows = data?.data ?? [];
  const total = data?.count ?? 0;

  return (
    <div className="space-y-4">
      {/* Filtres en 1 ligne */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="input min-w-[240px]"
          placeholder="Recherche nom"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        <select
          value={familleId ?? ''}
          onChange={(e) => {
            const v = e.target.value || null;
            setFamilleId(v);
            setSousFamilleId(null);
            setPage(1);
          }}
          className="select"
        >
          <option value="">Toutes les familles</option>
          {(familles || []).map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>

        <select
          value={sousFamilleId ?? ''}
          onChange={(e) => {
            const v = e.target.value || null;
            setSousFamilleId(v);
            setPage(1);
          }}
          className="select"
        >
          <option value="">Toutes les sous-familles</option>
          {sousFamillesOptions.map(sf => <option key={sf.id} value={sf.id}>{sf.nom}</option>)}
        </select>

        <select
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value);
            setPage(1);
          }}
          className="select"
        >
          <option value="tous">Tous</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>

        <div className="ml-auto flex gap-2">
          <Button onClick={() => {/* open modal nouveau produit */}}>Nouveau produit</Button>
          <Button variant="secondary" onClick={() => {/* export excel */}}>Exporter vers Excel</Button>
          <Button variant="secondary" onClick={() => {/* import excel */}}>Importer via Excel</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Unité</th>
              <th className="text-left p-3">PMP (€)</th>
              <th className="text-left p-3">Sous-famille</th>
              <th className="text-left p-3">Zone de stockage</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr><td className="p-4" colSpan={7}>Erreur lors du chargement des produits.</td></tr>
            )}
            {isLoading && !error && (
              <tr><td className="p-4" colSpan={7}>Chargement…</td></tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr><td className="p-4" colSpan={7}>Aucun produit trouvé. Essayez d’ajouter un produit via le bouton ci-dessus.</td></tr>
            )}
            {!error && rows.map(p => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="p-3">{p.nom}</td>
                <td className="p-3">{p.unite ?? '—'}</td>
                <td className="p-3">{Number(p.pmp || 0).toFixed(2)}</td>
                <td className="p-3">{p.sous_famille?.nom ?? '—'}</td>
                <td className="p-3">{p.zone_stockage ?? '—'}</td>
                <td className="p-3">{p.actif ? 'Actif' : 'Inactif'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary">Voir</Button>
                    <Button size="sm" variant="secondary">Modifier</Button>
                    <Button size="sm" variant="secondary">{p.actif ? 'Désactiver' : 'Activer'}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div>Total : {rows.length}</div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
          <div>Page {page} sur {Math.max(1, Math.ceil(total / pageSize))}</div>
          <Button
            variant="secondary"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}

