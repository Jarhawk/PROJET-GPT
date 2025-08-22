// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import express from 'express';
import { supabase } from '@/lib/supabase';

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
    let query = supabase
      .from('requisition_lignes')
      .select('quantite, produit_id, requisitions!inner(mama_id,date_requisition,statut)')
      .eq('requisitions.mama_id', mama_id)
      .eq('requisitions.statut', 'réalisée');
    if (since) query = query.gte('requisitions.date_requisition', since);
    if (type) void type; // les lignes de réquisition sont des sorties
    let column = sortBy;
    let ascending = order !== 'desc';
    if (column.includes('.')) {
      const parts = column.split('.');
      const dir = parts.pop();
      if (dir === 'asc' || dir === 'desc') {
        ascending = dir === 'asc';
        column = parts.join('.');
      }
    }
    query = query.order('requisitions.' + column, { ascending });
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
