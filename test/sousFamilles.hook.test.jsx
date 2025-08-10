// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  ilike: vi.fn(() => query),
  then: (resolve) => resolve({ data: [], error: null }),
};

const singleMock = vi.fn(() => Promise.resolve({ data: { id: 'sf1' }, error: null }));
const insertMock = vi.fn(() => ({ select: vi.fn(() => ({ single: singleMock })) }));
const eqAfterUpdate2 = vi.fn(() => Promise.resolve({ error: null }));
const eqAfterUpdate1 = vi.fn(() => ({ eq: eqAfterUpdate2 }));
const updateMock = vi.fn(() => ({ eq: eqAfterUpdate1 }));

const fromMock = vi.fn(() => ({
  select: query.select,
  eq: query.eq,
  ilike: query.ilike,
  order: vi.fn(() => query),
  insert: insertMock,
  update: updateMock,
}));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useSousFamilles;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ useSousFamilles } = await import('@/hooks/useSousFamilles.js'));
});

test('list filtre par famille et nom', async () => {
  const { result } = renderHook(() => useSousFamilles());
  await act(async () => {
    await result.current.list({ familleId: 'f1', search: 'po', actif: true });
  });
  expect(fromMock).toHaveBeenCalledWith('sous_familles');
  expect(query.eq).toHaveBeenNthCalledWith(1, 'mama_id', 'm1');
  expect(query.eq).toHaveBeenNthCalledWith(2, 'actif', true);
  expect(query.eq).toHaveBeenNthCalledWith(3, 'famille_id', 'f1');
  expect(query.ilike).toHaveBeenCalledWith('nom', '%po%');
});

test('create insère la sous-famille avec mama_id', async () => {
  const { result } = renderHook(() => useSousFamilles());
  await act(async () => {
    await result.current.create({ nom: 'SF', actif: true, famille_id: 'f1' });
  });
  expect(insertMock).toHaveBeenCalledWith([{ nom: 'SF', actif: true, famille_id: 'f1', mama_id: 'm1' }]);
});

test('toggleActif met à jour le champ actif', async () => {
  const { result } = renderHook(() => useSousFamilles());
  await act(async () => {
    await result.current.toggleActif('sf1', false);
  });
  expect(updateMock).toHaveBeenCalledWith({ actif: false });
  expect(eqAfterUpdate1).toHaveBeenCalledWith('id', 'sf1');
  expect(eqAfterUpdate2).toHaveBeenCalledWith('mama_id', 'm1');
});
