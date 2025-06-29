// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, describe, it, expect } from 'vitest';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

const insert = vi.fn(() => Promise.resolve({}));
const rpc = vi.fn((name) => {
  if (name === 'mouvements_without_alloc') {
    return Promise.resolve({ data: [{ id: '1', produit_id: 'p1', quantite: -2, valeur: -4, mama_id: 'm1' }], error: null });
  }
  if (name === 'suggest_cost_centers') {
    return Promise.resolve({ data: [{ cost_center_id: 'cc1', ratio: 1 }], error: null });
  }
  return Promise.resolve({ data: [], error: null });
});

vi.mock('@supabase/supabase-js', () => {
  return { createClient: () => ({ rpc, from: () => ({ insert }) }) };
});

import { reallocateHistory } from '../scripts/reallocate_history.js';

describe('reallocateHistory', () => {
  it('runs without throwing', async () => {
    await expect(reallocateHistory(1)).resolves.not.toThrow();
    expect(rpc).toHaveBeenCalledWith('mouvements_without_alloc', { limit_param: 1 });
    expect(rpc).toHaveBeenCalledWith('suggest_cost_centers', { p_produit_id: 'p1' });
    expect(insert).toHaveBeenCalled();
  });
});
