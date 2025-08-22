// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */
import express from 'express';
import produitsRouter from './produits.js';
import stockRouter from './stock.js';
import promotionsRouter from './promotions.js';
import { supabase } from '@/lib/supabase';

const router = express.Router();

// Middleware d'authentification basique (API Key ou JWT)
router.use(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];

  // Vérification d'une clé API statique
  if (process.env.PUBLIC_API_KEY && apiKey === process.env.PUBLIC_API_KEY) {
    req.user = { mama_id: req.query.mama_id };
    return next();
  }

  // Vérification d'un token Bearer via Supabase
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data, error } = await supabase.auth.getUser(token);
    if (data?.user && !error) {
      req.user = {
        mama_id: req.query.mama_id || data.user.user_metadata?.mama_id,
      };
      return next();
    }
  }

  return res.status(401).json({ error: 'Unauthorized' });
});

router.use('/produits', produitsRouter);
router.use('/stock', stockRouter);
router.use('/promotions', promotionsRouter);

export default router;
