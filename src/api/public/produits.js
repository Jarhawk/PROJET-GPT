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

// GET /api/public/v1/produits
router.get('/', async (req, res) => {
  const { mama_id } = req.user || {};
  const { famille } = req.query;
  if (!mama_id) return res.status(400).json({ error: 'mama_id requis' });
  try {
    if (!supabase) throw new Error('Missing Supabase credentials');
    let query = supabase
      .from('produits')
      .select('*')
      .eq('mama_id', mama_id);
    if (famille) query = query.eq('famille', famille);
    const { data, error } = await query.limit(100);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
