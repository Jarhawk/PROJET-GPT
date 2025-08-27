import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  contains: vi.fn(() => query),
  gte: vi.fn(() => query),
  lte: vi.fn(() => query),
  order: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
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
  expect(fromMock).toHaveBeenCalledWith('taches');
  expect(query.select).toHaveBeenCalledWith('id, titre, description, assignes, date_echeance, statut, utilisateur_id, mama_id');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('statut', 'a_faire');
  expect(query.contains).toHaveBeenCalledWith('assignes', ['u2']);
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
  expect(fromMock).toHaveBeenCalledWith('taches');
  const firstInsert = query.insert.mock.calls[0][0][0];
  expect(firstInsert).toEqual({
    titre: 'A',
    description: '',
    priorite: 'moyenne',
    date_echeance: '2025-05-01',
    assignes: ['u2'],
    statut: 'a_faire',
    mama_id: 'm1',
  });
});

test('deleteTache performs soft delete', async () => {
  const { result } = renderHook(() => useTaches());
  await act(async () => {
    await result.current.deleteTache('t1');
  });
  expect(fromMock).toHaveBeenCalledWith('taches');
  expect(query.update).toHaveBeenCalledWith({ actif: false });
  expect(query.eq).toHaveBeenCalledWith('id', 't1');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
});
