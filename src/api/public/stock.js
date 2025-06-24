/* eslint-env node */
import express from 'express';

const router = express.Router();

// GET /api/public/v1/stock
router.get('/', async (req, res) => {
  const { mama_id } = req.user || {};
  if (!mama_id) return res.status(400).json({ error: 'mama_id requis' });
  try {
    // Placeholder pour récupérer les mouvements de stock
    const data = [];
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
