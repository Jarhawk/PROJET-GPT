/* eslint-env node */
import express from 'express';

const router = express.Router();

// GET /api/public/v1/produits
router.get('/', async (req, res) => {
  const { mama_id } = req.user || {};
  if (!mama_id) return res.status(400).json({ error: 'mama_id requis' });
  try {
    // Exemple: récupération via Supabase
    // const { data, error } = await supabase.from('products').select('*').eq('mama_id', mama_id);
    // if (error) throw error;
    const data = []; // Placeholder
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
