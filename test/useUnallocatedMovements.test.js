import { describe, it, expect, vi } from 'vitest';
import { useUnallocatedMovements } from '../src/hooks/useUnallocatedMovements.js';

vi.mock('../src/lib/supabase', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ mama_id: '1' }) }));

describe('useUnallocatedMovements', () => {
  it('calls mouvements_without_alloc RPC', async () => {
    const { supabase } = await import('../src/lib/supabase');
    supabase.rpc.mockResolvedValue({ data: [], error: null });
    const { fetchUnallocated } = useUnallocatedMovements();
    await fetchUnallocated({ limit: 5 });
    expect(supabase.rpc).toHaveBeenCalledWith('mouvements_without_alloc', { limit_param: 5 });
  });
});
