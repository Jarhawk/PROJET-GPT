// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import express from 'express';
import produitsRouter from './produits.js';
import stockRouter from './stock.js';
import promotionsRouter from './promotions.js';

const router = express.Router();

// Middleware d'authentification basique (API Key ou JWT)
router.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (process.env.PUBLIC_API_KEY && apiKey === process.env.PUBLIC_API_KEY) {
    req.user = { mama_id: req.query.mama_id };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
});

router.use('/produits', produitsRouter);
router.use('/stock', stockRouter);
router.use('/promotions', promotionsRouter);

export default router;
