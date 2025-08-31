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
vi.mock('@/lib/supabase', () => ({
  __esModule: true,
  supabase: { from: fromMock },
  default: { from: fromMock },
}));
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
  expect(queryObj.select).toHaveBeenCalledWith('id, module, payload, status:statut, created_at');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('actif', true);
  expect(queryObj.order).toHaveBeenCalledWith('created_at', { ascending: false });
});

test('addRequest inserts with user and mama_id', async () => {
  const { result } = renderHook(() => useValidations());
  await act(async () => { await result.current.addRequest({ module: 'm', entity_id: 'e', action: 'a' }); });
  expect(queryObj.insert).toHaveBeenCalledWith([
    {
      module: 'm',
      payload: { entity_id: 'e', action: 'a' },
      user_id: 'u1',
      mama_id: 'm1',
      statut: 'pending',
      actif: true,
    },
  ]);
});

test('updateStatus updates statut', async () => {
  const { result } = renderHook(() => useValidations());
  await act(async () => { await result.current.updateStatus('id1', 'approved'); });
  expect(queryObj.update).toHaveBeenCalledWith({ statut: 'approved' });
  expect(queryObj.eq).toHaveBeenCalledWith('id', 'id1');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('actif', true);
});
