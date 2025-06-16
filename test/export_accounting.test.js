import { vi, describe, it, expect } from 'vitest';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';
vi.mock('fs', () => ({
  default: { writeFileSync: vi.fn() },
  writeFileSync: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => {
  const lt = vi.fn(() => Promise.resolve({ data: [], error: null }));
  const gte = vi.fn(() => ({ lt }));
  const eq = vi.fn(() => ({ gte, lt }));
  const select = vi.fn(() => ({ eq, gte, lt }));
  const from = vi.fn(() => ({ select }));
  return { createClient: () => ({ from }) };
});
import { exportAccounting } from '../scripts/export_accounting.js';

describe('exportAccounting', () => {
  it('runs without throwing', async () => {
    await expect(exportAccounting('2024-01')).resolves.not.toThrow();
  });
});
