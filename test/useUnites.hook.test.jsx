// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  ilike: vi.fn(() => query),
  order: vi.fn(() => query),
  range: vi.fn(() => query),
  then: vi.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
};

const singleMock = vi.fn(() => Promise.resolve({ data: { id: 'u1' }, error: null }));
const insertSelectMock = vi.fn(() => ({ single: singleMock }));
const insertMock = vi.fn(() => ({ select: insertSelectMock }));
const updateSelectMock = vi.fn(() => ({ single: singleMock }));
const updateEqMock2 = vi.fn(() => ({ select: updateSelectMock }));
const updateEqMock1 = vi.fn(() => ({ eq: updateEqMock2 }));
const updateMock = vi.fn(() => ({ eq: updateEqMock1 }));
const deleteEq2 = vi.fn(() => Promise.resolve({ error: null }));
const deleteEq1 = vi.fn(() => ({ eq: deleteEq2 }));
const deleteMock = vi.fn(() => ({ eq: deleteEq1 }));

const fromMock = vi.fn(() => ({
  select: query.select,
  eq: query.eq,
  ilike: query.ilike,
  order: query.order,
  range: query.range,
  insert: insertMock,
  update: updateMock,
  delete: deleteMock,
}));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useUnites;
let wrapper;

beforeEach(async () => {
  vi.clearAllMocks();
  query.then.mockImplementation((resolve) => resolve({ data: [], error: null, count: 0 }));
  ({ useUnites } = await import('@/hooks/useUnites.js'));
  const queryClient = new QueryClient();
  wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
});

test('requête initiale sélectionne les colonnes existantes', async () => {
  renderHook(() => useUnites(), { wrapper });
  await act(async () => {});
  expect(fromMock).toHaveBeenCalledWith('unites');
  expect(query.select).toHaveBeenCalledWith('id, nom, actif', { count: 'exact' });
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
});

test("addUnite insère l'unité avec mama_id", async () => {
  const { result } = renderHook(() => useUnites(), { wrapper });
  await act(async () => {
    await result.current.addUnite('Kg');
  });
  expect(insertMock).toHaveBeenCalledWith([{ nom: 'Kg', mama_id: 'm1' }]);
  expect(insertSelectMock).toHaveBeenCalledWith('id, nom, actif');
});

test('updateUnite met à jour le champ et filtre par mama_id', async () => {
  const { result } = renderHook(() => useUnites(), { wrapper });
  await act(async () => {
    await result.current.updateUnite('u1', { nom: 'L' });
  });
  expect(updateMock).toHaveBeenCalledWith({ nom: 'L' });
  expect(updateEqMock1).toHaveBeenCalledWith('id', 'u1');
  expect(updateEqMock2).toHaveBeenCalledWith('mama_id', 'm1');
  expect(updateSelectMock).toHaveBeenCalledWith('id, nom, actif');
});

test('deleteUnite filtre par id et mama_id', async () => {
  const { result } = renderHook(() => useUnites(), { wrapper });
  await act(async () => {
    await result.current.deleteUnite('u1');
  });
  expect(deleteMock).toHaveBeenCalled();
  expect(deleteEq1).toHaveBeenCalledWith('id', 'u1');
  expect(deleteEq2).toHaveBeenCalledWith('mama_id', 'm1');
});
