// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  limit: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  gte: vi.fn(() => queryObj),
  lte: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: '1' }) }));

let useAuditTrail;

beforeEach(async () => {
  ({ useAuditTrail } = await import('@/hooks/useAuditTrail'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.order.mockClear();
  queryObj.limit.mockClear();
  queryObj.eq.mockClear();
  queryObj.gte.mockClear();
  queryObj.lte.mockClear();
});

test('fetchEntries queries journal_audit with filters', async () => {
  const { result } = renderHook(() => useAuditTrail());
  await act(async () => {
    await result.current.fetchEntries({ table: 'produits', start: '2024-01-01', end: '2024-01-31' });
  });
  expect(fromMock).toHaveBeenCalledWith('journal_audit');
  expect(queryObj.select).toHaveBeenCalledWith('*, utilisateurs:utilisateur_id(nom)');
  expect(queryObj.order).toHaveBeenCalledWith('date_action', { ascending: false });
  expect(queryObj.limit).toHaveBeenCalledWith(100);
  expect(queryObj.eq).toHaveBeenCalledWith('table_modifiee', 'produits');
  expect(queryObj.gte).toHaveBeenCalledWith('date_action', '2024-01-01');
  expect(queryObj.lte).toHaveBeenCalledWith('date_action', '2024-01-31');
});

test('fetchEntries returns empty array on error', async () => {
  queryObj.then = (fn) => Promise.resolve(fn({ data: null, error: { message: 'oops' } }));
  const { result } = renderHook(() => useAuditTrail());
  let data;
  await act(async () => { data = await result.current.fetchEntries(); });
  expect(data).toEqual([]);
});
