import express from 'express';
import produitsRouter from './produits.js';
import stockRouter from './stock.js';

const router = express.Router();

// Middleware d'authentification basique (API Key ou JWT)
router.use(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  if (!apiKey && !authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // TODO: vérifier la clé ou le token
  // Pour l'instant on attache un mama_id fictif
  req.user = { mama_id: req.query.mama_id };
  next();
});

router.use('/produits', produitsRouter);
router.use('/stock', stockRouter);

export default router;
