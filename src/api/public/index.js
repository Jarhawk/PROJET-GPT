/* eslint-env node */
/* global process */
import express from 'express';
import produitsRouter from './produits.js';
import stockRouter from './stock.js';
import { createClient } from '@supabase/supabase-js';

// Supabase client used to validate Bearer tokens when provided
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
  if (authHeader && supabase) {
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

export default router;
