// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  insert: vi.fn(() => queryObj),
  update: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ default: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1', user: { id: 'u1' } }) }));

let useValidations;

beforeEach(async () => {
  ({ default: useValidations } = await import('@/hooks/useValidations'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.order.mockClear();
  queryObj.eq.mockClear();
  queryObj.insert.mockClear();
  queryObj.update.mockClear();
});

test('fetchRequests queries table', async () => {
  const { result } = renderHook(() => useValidations());
  await act(async () => { await result.current.fetchRequests(); });
  expect(fromMock).toHaveBeenCalledWith('validation_requests');
  expect(queryObj.select).toHaveBeenCalledWith('*');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('actif', true);
  expect(queryObj.order).toHaveBeenCalledWith('created_at', { ascending: false });
});

test('addRequest inserts with user and mama_id', async () => {
  const { result } = renderHook(() => useValidations());
  await act(async () => { await result.current.addRequest({ module: 'm', action: 'a' }); });
  expect(queryObj.insert).toHaveBeenCalledWith([{ module: 'm', action: 'a', mama_id: 'm1', requested_by: 'u1', actif: true }]);
});

test('updateStatus updates reviewed fields', async () => {
  const { result } = renderHook(() => useValidations());
  await act(async () => { await result.current.updateStatus('id1', 'approved'); });
  expect(queryObj.update).toHaveBeenCalledWith({ status: 'approved', reviewed_by: 'u1', reviewed_at: expect.any(String) });
  expect(queryObj.eq).toHaveBeenCalledWith('id', 'id1');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('actif', true);
});
