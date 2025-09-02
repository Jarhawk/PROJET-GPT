// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useMemo, useEffect } from 'react';
import { useProduits } from '@/hooks/data/useProduits';
import { useFamilles } from '@/hooks/data/useFamilles';
import { useSousFamilles } from '@/hooks/data/useSousFamilles';
import { useUnites } from '@/hooks/useUnites';
import useDebounce from '@/hooks/useDebounce';
import { logSupaError } from '@/lib/supa/logError';

export default function Produits() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [statut, setStatut] = useState('tous'); // 'tous' | 'actif' | 'inactif'
  const [familleId, setFamilleId] = useState('');
  const [sousFamilleId, setSousFamilleId] = useState('');
  const dq = useDebounce(q, 250);

  const { familles = [] } = useFamilles();
  const { data: allSousFamilles = [] } = useSousFamilles();
  const { unites = [] } = useUnites();
  const safeFamilles = useMemo(
    () => (Array.isArray(familles) ? familles : []),
    [familles]
  );
  const safeAllSousFamilles = useMemo(
    () => (Array.isArray(allSousFamilles) ? allSousFamilles : []),
    [allSousFamilles]
  );
  const sousFamilles = useMemo(
    () =>
      familleId
        ? safeAllSousFamilles.filter(sf => sf.famille_id === familleId)
        : safeAllSousFamilles,
    [familleId, safeAllSousFamilles]
  );

  const { data, isLoading, error } = useProduits({
    search: dq,
    page,
    pageSize,
    statut,
    familleId: familleId || null,
    sousFamilleId: sousFamilleId || null,
  });
  const produits = Array.isArray(data?.data) ? data.data : [];
  const total = data?.count ?? 0;

  const unitesById = useMemo(() => {
    return new Map((Array.isArray(unites) ? unites : []).map(u => [u.id, u]));
  }, [unites]);
  const famillesById = useMemo(() => {
    return new Map(safeFamilles.map(f => [f.id, f]));
  }, [safeFamilles]);
  const sousFamillesById = useMemo(() => {
    return new Map(safeAllSousFamilles.map(sf => [sf.id, sf]));
  }, [safeAllSousFamilles]);

  useEffect(() => {
    if (error) logSupaError('produits:list', error);
  }, [error]);

  return (
    <div className="space-y-3">
      {/* Barre de filtres en UNE LIGNE */}
      <div className="flex items-center gap-2">
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
          {(() => {
            const opts = [];
            for (let i = 0; i < safeFamilles.length; i++) {
              const f = safeFamilles[i];
              opts.push(
                <option key={f.id} value={f.id}>{f.nom}</option>
              );
            }
            return opts;
          })()}
        </select>
        <select
          className="select"
          value={sousFamilleId}
          onChange={(e) => { setSousFamilleId(e.target.value); setPage(1); }}
        >
          <option value="">Toutes les sous-familles</option>
          {(() => {
            const opts = [];
            const list = Array.isArray(sousFamilles) ? sousFamilles : [];
            for (let i = 0; i < list.length; i++) {
              const sf = list[i];
              opts.push(
                <option key={sf.id} value={sf.id}>{sf.nom}</option>
              );
            }
            return opts;
          })()}
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
        <div className="p-2 bg-red-100 text-red-600 rounded">
          Erreur chargement produits.
        </div>
      )}

      {/* Tableau */}
      <div className="table w-full">
        <div className="table-header-group">
          <div className="table-row">
            <div className="table-cell font-semibold py-2">Nom</div>
            <div className="table-cell font-semibold py-2">Unité</div>
            <div className="table-cell font-semibold py-2">Famille &gt; Sous-famille</div>
            <div className="table-cell font-semibold py-2">Zone de stockage</div>
            <div className="table-cell font-semibold py-2">Statut</div>
            <div className="table-cell font-semibold py-2">Actions</div>
          </div>
        </div>
        <div className="table-row-group">
          {!isLoading && produits.length === 0 && (
            <div className="table-row">
              <div className="table-cell py-3 text-sm text-gray-400" colSpan={6}>
                Aucun produit trouvé. Essayez d’ajouter un produit via le bouton ci-dessus.
              </div>
            </div>
          )}
          {(() => {
            const rowsElems = [];
            const list = Array.isArray(produits) ? produits : [];
            for (let i = 0; i < list.length; i++) {
              const p = list[i];
              rowsElems.push(
                <div key={p.id} className="table-row">
                  <div className="table-cell py-2">{p.nom}</div>
                  <div className="table-cell py-2">{unitesById.get(p.unite_id)?.nom ?? '—'}</div>
                  <div className="table-cell py-2">
                    {(() => {
                      const sf = sousFamillesById.get(p.sous_famille_id);
                      if (sf) {
                        const famNom = famillesById.get(sf.famille_id)?.nom;
                        return famNom ? `${famNom} › ${sf.nom}` : sf.nom;
                      }
                      return '—';
                    })()}
                  </div>
                  <div className="table-cell py-2">{p.zone_stock_id ?? '—'}</div>
                  <div className="table-cell py-2">{p.actif ? 'Actif' : 'Inactif'}</div>
                  <div className="table-cell py-2"> {/* actions existantes */}</div>
                </div>
              );
            }
            return rowsElems;
          })()}
        </div>
      </div>

      {/* Footer pagination (existant) : remettre page à 1 sur changement de filtres */}
      {/* Total: {total} */}
    </div>
  );
}
