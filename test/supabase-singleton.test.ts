import { test, expect } from 'vitest';

// Ensure importing the client multiple times yields the same instance

test('supabase client is singleton', async () => {
  const { supabase } = await import('@/lib/supa/client');
  const { supabase: supabase2 } = await import('@/lib/supa/client');
  expect(supabase).toBe(supabase2);
});
