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
  delete: vi.fn(() => query),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1', user_id: 'u1' }) }));

let useTaches;

beforeEach(async () => {
  ({ useTaches } = await import('@/hooks/useTaches'));
  fromMock.mockClear();
  Object.values(query).forEach(fn => fn.mockClear && fn.mockClear());
});

test('getTaches applies filters', async () => {
  const { result } = renderHook(() => useTaches());
  await act(async () => {
    await result.current.getTaches({ statut: 'a_faire', priorite: 'haute', assigne: 'u2', start: '2025-01-01', end: '2025-01-31' });
  });
  expect(fromMock).toHaveBeenCalledWith('taches');
  expect(query.select).toHaveBeenCalledWith('*');
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(query.eq).toHaveBeenCalledWith('statut', 'a_faire');
  expect(query.eq).toHaveBeenCalledWith('priorite', 'haute');
  expect(query.contains).toHaveBeenCalledWith('assignes', ['u2']);
  expect(query.gte).toHaveBeenCalledWith('date_debut', '2025-01-01');
  expect(query.lte).toHaveBeenCalledWith('date_echeance', '2025-01-31');
});

test('createTache injects ids and computes due date', async () => {
  const { result } = renderHook(() => useTaches());
  await act(async () => {
    await result.current.createTache({ titre: 'A', date_debut: '2025-05-01', delai_jours: 3, assignes: [] });
  });
  expect(fromMock).toHaveBeenCalledWith('taches');
  const inserted = query.insert.mock.calls[0][0][0];
  expect(inserted.mama_id).toBe('m1');
  expect(inserted.created_by).toBe('u1');
  expect(inserted.date_echeance).toBe('2025-05-04');
});
