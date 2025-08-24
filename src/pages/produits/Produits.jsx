// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useMemo } from 'react';
import { useProduits } from '@/hooks/data/useProduits';
import { useFamilles } from '@/hooks/data/useFamilles';
import { useSousFamilles } from '@/hooks/data/useSousFamilles';
import { useDebounce } from '@/hooks/useDebounce';

export default function Produits() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [statut, setStatut] = useState('tous'); // 'tous' | 'actif' | 'inactif'
  const [familleId, setFamilleId] = useState('');
  const [sousFamilleId, setSousFamilleId] = useState('');
  const dq = useDebounce(q, 250);

  const { data: familles = [] } = useFamilles();
  const { data: allSousFamilles = [] } = useSousFamilles();
  const sousFamilles = useMemo(
    () => (familleId ? allSousFamilles.filter(sf => sf.famille_id === familleId) : allSousFamilles),
    [familleId, allSousFamilles]
  );

  const { data, isLoading, error } = useProduits({
    search: dq,
    page,
    pageSize,
    statut,
    familleId: familleId || null,
    sousFamilleId: sousFamilleId || null,
  });
  const produits = data?.data ?? [];
  const total = data?.count ?? 0;

  return (
    <div className="space-y-3">
      {/* Barre de filtres en UNE LIGNE */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input"
          placeholder="Recherche nom"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          style={{ minWidth: 220 }}
        />
        <select
          className="select"
          value={familleId}
          onChange={(e) => { setFamilleId(e.target.value); setSousFamilleId(''); setPage(1); }}
        >
          <option value="">Toutes les familles</option>
          {familles.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
        <select
          className="select"
          value={sousFamilleId}
          onChange={(e) => { setSousFamilleId(e.target.value); setPage(1); }}
        >
          <option value="">Toutes les sous-familles</option>
          {sousFamilles.map(sf => <option key={sf.id} value={sf.id}>{sf.nom}</option>)}
        </select>
        <select
          className="select"
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(1); }}
        >
          <option value="tous">Tous</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
        </select>
      </div>

      {error && (
        <div className="text-red-400">Erreur chargement produits.</div>
      )}

      {/* Tableau */}
      <div className="table w-full">
        <div className="table-header-group">
          <div className="table-row">
            <div className="table-cell font-semibold py-2">Nom</div>
            <div className="table-cell font-semibold py-2">Unité</div>
            <div className="table-cell font-semibold py-2">PMP (€)</div>
            <div className="table-cell font-semibold py-2">Sous-famille</div>
            <div className="table-cell font-semibold py-2">Zone de stockage</div>
            <div className="table-cell font-semibold py-2">Statut</div>
            <div className="table-cell font-semibold py-2">Actions</div>
          </div>
        </div>
        <div className="table-row-group">
          {!isLoading && produits.length === 0 && (
            <div className="table-row">
              <div className="table-cell py-3 text-sm text-gray-400" colSpan={7}>
                Aucun produit trouvé. Essayez d’ajouter un produit via le bouton ci-dessus.
              </div>
            </div>
          )}
          {produits.map((p) => (
            <div key={p.id} className="table-row">
              <div className="table-cell py-2">{p.nom}</div>
              <div className="table-cell py-2">{p.unite_id ?? '—'}</div>
              <div className="table-cell py-2">{(p.pmp ?? 0).toFixed(2)}</div>
              <div className="table-cell py-2">{p.sous_famille?.nom ?? '—'}</div>
              <div className="table-cell py-2">{p.zone_id ?? '—'}</div>
              <div className="table-cell py-2">{p.actif ? 'Actif' : 'Inactif'}</div>
              <div className="table-cell py-2"> {/* actions existantes */}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer pagination (existant) : remettre page à 1 sur changement de filtres */}
      {/* Total: {total} */}
    </div>
  );
}
