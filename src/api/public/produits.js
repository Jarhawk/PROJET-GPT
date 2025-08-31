// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import express from 'express';
import { getSupabaseClient } from '@/lib/supabase';

const router = express.Router();

// GET /api/public/v1/produits
router.get('/', async (req, res) => {
  const {
    famille,
    search = '',
    page = '1',
    limit = '100',
    sortBy = 'famille',
    order = 'asc',
    mama_id: queryMamaId,
  } = req.query;
  const mama_id = req.user?.mama_id ?? queryMamaId;
  if (!mama_id) return res.status(400).json({ error: 'mama_id requis' });
  try {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Missing Supabase credentials');
    let query = supabase
      .from('v_produits_dernier_prix')
      .select(
        'produit_id, nom, famille_id, famille, unite_id, unite, stock_reel, stock_min, fournisseur_id, fournisseur, dernier_prix, derniere_livraison:date_livraison, mama_id'
      )
      .eq('mama_id', mama_id);
    if (famille) query = query.ilike('famille', `%${famille}%`);
    if (search) query = query.ilike('nom', `%${search}%`);
    let sortField = sortBy;
    let ascending = order !== 'desc';
    if (sortField.includes('.')) {
      const parts = sortField.split('.');
      const dir = parts.pop();
      if (dir === 'asc' || dir === 'desc') {
        ascending = dir === 'asc';
        sortField = parts.join('.');
      }
    }
    query = query
      .order(sortField, { ascending })
      .order('nom', { ascending: true });
    const p = Math.max(parseInt(page, 10), 1);
    const l = Math.max(parseInt(limit, 10), 1);
    const start = (p - 1) * l;
    const end = start + l - 1;
    const { data, error } = await query.range(start, end);
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    res.json(rows);
  } catch (err) {
    if (String(err?.message).includes('Missing Supabase credentials')) {
      res.status(500).json({ error: 'Missing Supabase credentials' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
