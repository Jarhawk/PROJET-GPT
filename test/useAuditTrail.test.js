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
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: '1' }) }));

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

test('fetchEntries queries audit_entries with filters', async () => {
  const { result } = renderHook(() => useAuditTrail());
  await act(async () => {
    await result.current.fetchEntries({ table: 'products', start: '2024-01-01', end: '2024-01-31' });
  });
  expect(fromMock).toHaveBeenCalledWith('audit_entries');
  expect(queryObj.select).toHaveBeenCalledWith('*, utilisateurs:changed_by(email)');
  expect(queryObj.order).toHaveBeenCalledWith('changed_at', { ascending: false });
  expect(queryObj.limit).toHaveBeenCalledWith(100);
  expect(queryObj.eq).toHaveBeenCalledWith('table_name', 'products');
  expect(queryObj.gte).toHaveBeenCalledWith('changed_at', '2024-01-01');
  expect(queryObj.lte).toHaveBeenCalledWith('changed_at', '2024-01-31');
});

test('fetchEntries returns empty array on error', async () => {
  queryObj.then = (fn) => Promise.resolve(fn({ data: null, error: { message: 'oops' } }));
  const { result } = renderHook(() => useAuditTrail());
  let data;
  await act(async () => { data = await result.current.fetchEntries(); });
  expect(data).toEqual([]);
});
