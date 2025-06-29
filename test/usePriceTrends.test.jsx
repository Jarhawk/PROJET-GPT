// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() }
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ mama_id: 'm1' })
}));
import { usePriceTrends } from '@/hooks/usePriceTrends';
import { supabase } from '@/lib/supabase';

test('fetches price trends', async () => {
  supabase.from.mockReturnValue({
    select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ data: [{ mois: '2024-01', prix_moyen: 3 }] }) }) }) }),
  });
  const { result } = renderHook(() => usePriceTrends('p1'));
  await act(async () => {
    await result.current.fetchTrends('p1');
  });
  expect(result.current.data).toEqual([{ mois: '2024-01', prix_moyen: 3 }]);
});
