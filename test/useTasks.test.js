// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const singleMock = vi.fn(() => Promise.resolve({ data: { id: 't1' }, error: null }));
const orderMock = vi.fn(() => Promise.resolve({ data: [{ id: 't1' }], error: null }));
const queryChain = { eq: vi.fn(() => queryChain), order: orderMock, single: singleMock };
const selectMock = vi.fn(() => queryChain);
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useTasks;

beforeEach(async () => {
  ({ useTasks } = await import('@/hooks/useTasks'));
  fromMock.mockClear();
  selectMock.mockClear();
  queryChain.eq.mockClear();
  orderMock.mockClear();
  singleMock.mockClear();
});

test('fetchTasks queries Supabase and stores result', async () => {
  const { result } = renderHook(() => useTasks());
  await act(async () => {
    await result.current.fetchTasks();
  });
  expect(fromMock).toHaveBeenCalledWith('taches');
  expect(selectMock).toHaveBeenCalledWith('*, assigned:utilisateurs!taches_assigned_to_fkey(nom)');
  expect(queryChain.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(orderMock).toHaveBeenCalledWith('next_echeance', { ascending: true });
  expect(result.current.tasks).toEqual([{ id: 't1' }]);
});

test('fetchTaskById queries Supabase with id and mama_id', async () => {
  const { result } = renderHook(() => useTasks());
  await act(async () => {
    await result.current.fetchTaskById('t1');
  });
  expect(fromMock).toHaveBeenCalledWith('taches');
  expect(selectMock).toHaveBeenCalledWith('*, assigned:utilisateurs!taches_assigned_to_fkey(nom)');
  expect(queryChain.eq).toHaveBeenNthCalledWith(1, 'id', 't1');
  expect(queryChain.eq).toHaveBeenNthCalledWith(2, 'mama_id', 'm1');
  expect(singleMock).toHaveBeenCalled();
});

test('fetchTasksByStatus filters by status', async () => {
  const { result } = renderHook(() => useTasks());
  await act(async () => {
    await result.current.fetchTasksByStatus('fait');
  });
  expect(fromMock).toHaveBeenCalledWith('taches');
  expect(selectMock).toHaveBeenCalledWith('*, assigned:utilisateurs!taches_assigned_to_fkey(nom)');
  expect(queryChain.eq).toHaveBeenNthCalledWith(1, 'mama_id', 'm1');
  expect(queryChain.eq).toHaveBeenNthCalledWith(2, 'statut', 'fait');
  expect(orderMock).toHaveBeenCalledWith('next_echeance', { ascending: true });
});
