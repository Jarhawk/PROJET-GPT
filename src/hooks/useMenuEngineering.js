// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useMenuEngineering() {
  const { mama_id } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(
    async ({ dateStart, dateEnd } = {}) => {
      if (!mama_id) return { rows: [], foodCost: null };
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('v_menu_engineering')
          .select(
            'mama_id, fiche_id, nom, famille, prix_vente, cout_portion, periode, ventes, popularite, marge'
          )
          .eq('mama_id', mama_id);
        if (dateStart) query = query.gte('periode', dateStart);
        if (dateEnd) query = query.lte('periode', dateEnd);

        const { data: rows, error: qError } = await query;
        if (qError) throw qError;

        let foodCost = null;
        if (dateStart) {
          const month = dateStart.slice(0, 7);
          const { data: fcData, error: fcError } = await supabase
            .from('v_menu_du_jour_mensuel')
            .select('food_cost_avg')
            .eq('mama_id', mama_id)
            .eq('mois', month)
            .maybeSingle();
          if (fcError) throw fcError;
          foodCost = fcData?.food_cost_avg ?? null;
        }

        setMetrics(rows || []);
        return { rows: rows || [], foodCost };
      } catch (e) {
        setError(e);
        setMetrics([]);
        return { rows: [], foodCost: null };
      } finally {
        setLoading(false);
      }
    },
    [mama_id]
  );

  const commitImport = useCallback(async () => {
    if (!mama_id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: staged, error: stError } = await supabase
        .from('ventes_import_staging')
        .select('id, fiche_id, date_vente, quantite, prix_vente_unitaire')
        .eq('mama_id', mama_id)
        .eq('statut', 'mapped');
      if (stError) throw stError;
      const rows = Array.isArray(staged) ? staged : [];
      if (rows.length === 0) return;

      const toInsert = [];
      const ids = [];
      for (const r of rows) {
        toInsert.push({
          mama_id,
          fiche_id: r.fiche_id,
          date_vente: r.date_vente,
          quantite: r.quantite,
          prix_vente_unitaire: r.prix_vente_unitaire,
        });
        ids.push(r.id);
      }
      const { error: insError } = await supabase
        .from('ventes_fiches')
        .insert(toInsert);
      if (insError) throw insError;

      const { error: updError } = await supabase
        .from('ventes_import_staging')
        .update({ statut: 'imported' })
        .in('id', ids);
      if (updError) throw updError;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [mama_id]);

  const upsertManual = useCallback(
    async ({ fiche_id, date_vente, quantite, prix_vente_unitaire }) => {
      if (!mama_id) return;
      setError(null);
      const { error: upError } = await supabase
        .from('ventes_fiches')
        .upsert(
          [{ mama_id, fiche_id, date_vente, quantite, prix_vente_unitaire }],
          { onConflict: 'mama_id,fiche_id,date_vente' }
        );
      if (upError) {
        setError(upError);
        throw upError;
      }
    },
    [mama_id]
  );

  return { metrics, loading, error, fetchMetrics, commitImport, upsertManual };
}

export default useMenuEngineering;

