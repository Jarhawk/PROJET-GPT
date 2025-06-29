// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, describe, it, expect } from 'vitest';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';
vi.mock('@supabase/supabase-js', () => {
  return { createClient: () => ({ rpc: vi.fn().mockResolvedValue({ data: [] }) }) };
});
import { generateWeeklyCostCenterReport } from '../scripts/weekly_report.js';

describe('weekly report script', () => {
  it('runs without throwing', async () => {
    await expect(generateWeeklyCostCenterReport()).resolves.not.toThrow();
  });
});
