// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import express from 'express';
import { TABLES } from '@/constants/tables';
import supabase from '@/lib/supabase';
import { applyRange } from '@/lib/supa/applyRange';

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
    let query = supabase.from(TABLES.MOUVEMENTS).select('*').eq('mama_id', mama_id);
    if (since) query = query.gte('date', since);
    if (type) query = query.eq('type', type);
    query = query.order(sortBy, { ascending: order === 'asc' });
    const p = Math.max(parseInt(page, 10), 1);
    const l = Math.max(parseInt(limit, 10), 1);
    const start = (p - 1) * l;
    const { data, error } = await applyRange(query, start, l);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    if (String(err?.message).includes('Missing Supabase credentials')) {
      res.status(500).json({ error: 'Missing Supabase credentials' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
