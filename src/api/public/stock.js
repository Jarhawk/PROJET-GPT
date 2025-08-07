// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import express from 'express';
import { getSupabaseClient } from '../shared/supabaseClient.js';

let supabase = null;
try {
  supabase = getSupabaseClient();
} catch {
  // Supabase credentials missing; routes will return error
}

const router = express.Router();

// GET /api/public/v1/stock
router.get('/', async (req, res) => {
  const { mama_id } = req.user || {};
  const {
    since,
    type,
    page = '1',
    limit = '100',
    sortBy = 'date',
    order = 'desc',
  } = req.query;
  if (!mama_id) return res.status(400).json({ error: 'mama_id requis' });
  try {
    if (!supabase) throw new Error('Missing Supabase credentials');
    let query = supabase
      .from('mouvements')
      .select('*')
      .eq('mama_id', mama_id);
    if (since) query = query.gte('date', since);
    if (type) query = query.eq('type', type);
    query = query.order(sortBy, { ascending: order !== 'desc' });
    const p = Math.max(parseInt(page, 10), 1);
    const l = Math.max(parseInt(limit, 10), 1);
    const start = (p - 1) * l;
    const end = start + l - 1;
    const { data, error } = await query.range(start, end);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
