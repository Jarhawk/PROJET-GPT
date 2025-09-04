import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  gte: vi.fn(() => query),
  lte: vi.fn(() => query),
  order: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  single: vi.fn(() => ({ data: { id: 't1' } })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1', user_id: 'u1' }) }));

let useTaches;

beforeEach(async () => {
  ({ useTaches } = await import('@/hooks/useTaches'));
  fromMock.mockClear();
  Object.values(query).forEach(fn => fn.mockClear && fn.mockClear());
});

test('fetchTaches applies filters', async () => {
  const { result } = renderHook(() => useTaches());
  await act(async () => {
    await result.current.fetchTaches({
      statut: 'a_faire',
      utilisateur: 'u2',
      start: '2025-01-01',
      end: '2025-01-31',
    });
  });
  expect(fromMock).toHaveBeenCalledWith('v_taches_assignees');
  expect(query.select).toHaveBeenCalledWith('*');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('statut', 'a_faire');
  expect(query.eq).toHaveBeenCalledWith('utilisateur_id', 'u2');
  expect(query.gte).toHaveBeenCalledWith('date_echeance', '2025-01-01');
  expect(query.lte).toHaveBeenCalledWith('date_echeance', '2025-01-31');
});

test('createTache inserts task and assignments', async () => {
  const { result } = renderHook(() => useTaches());
  await act(async () => {
    await result.current.createTache({
      titre: 'A',
      description: '',
      priorite: 'moyenne',
      date_echeance: '2025-05-01',
      assignes: ['u2'],
      statut: 'a_faire',
    });
  });
  expect(fromMock).toHaveBeenNthCalledWith(1, 'taches');
  expect(fromMock).toHaveBeenNthCalledWith(2, 'utilisateurs_taches');
  const firstInsert = query.insert.mock.calls[0][0][0];
  expect(firstInsert.mama_id).toBe('m1');
  const secondInsert = query.insert.mock.calls[1][0][0];
  expect(secondInsert).toEqual({ tache_id: 't1', utilisateur_id: 'u2' });
});

test('deleteTache performs soft delete', async () => {
  const { result } = renderHook(() => useTaches());
  await act(async () => {
    await result.current.deleteTache('t1');
  });
  expect(fromMock).toHaveBeenNthCalledWith(1, 'utilisateurs_taches');
  expect(query.delete).toHaveBeenCalled();
  expect(fromMock).toHaveBeenNthCalledWith(2, 'taches');
  expect(query.update).toHaveBeenCalledWith({ actif: false });
});
