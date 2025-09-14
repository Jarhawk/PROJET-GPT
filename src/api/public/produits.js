// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import express from 'express';
import supabase from '@/lib/supabase';
import { applySearchOr, applyRange } from '@/lib/supa/queryHelpers';

const router = express.Router();

// GET /api/public/v1/produits
router.get('/', async (req, res) => {
  const { mama_id } = req.user || {};
  const {
    famille,
    search = '',
    actif,
    page = '1',
    limit = '100',
    sortBy = 'nom',
    order = 'asc',
  } = req.query;
  if (!mama_id) return res.status(400).json({ error: 'mama_id requis' });
  try {
    let query = supabase
      .from('v_produits_dernier_prix')
      .select('*')
      .eq('mama_id', mama_id);
    if (famille) query = query.ilike('famille', `%${famille}%`);
    query = applySearchOr(query, search);
    if (actif !== undefined) query = query.eq('actif', actif === 'true');
    const sortField = sortBy;
    const ascending = order !== 'desc';
    query = query.order(sortField, { ascending });
    const p = Math.max(parseInt(page, 10), 1);
    const l = Math.max(parseInt(limit, 10), 1);
    const start = (p - 1) * l;
    const { data, error } = await applyRange(query, start, l);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
