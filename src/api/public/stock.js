/* eslint-env node */
/* global process */
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const router = express.Router();

// GET /api/public/v1/stock
router.get('/', async (req, res) => {
  const { mama_id } = req.user || {};
  const { since } = req.query;
  if (!mama_id) return res.status(400).json({ error: 'mama_id requis' });
  try {
    if (!supabase) throw new Error('Missing Supabase credentials');
    let query = supabase
      .from('mouvements_stock')
      .select('*')
      .eq('mama_id', mama_id)
      .order('date', { ascending: false });
    if (since) query = query.gte('date', since);
    const { data, error } = await query.limit(100);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
