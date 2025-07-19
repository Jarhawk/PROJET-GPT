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
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1', user: { id: 'u1' } }) }));

let useValidations;

beforeEach(async () => {
  ({ useValidations } = await import('@/hooks/useValidations'));
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
  expect(queryObj.order).toHaveBeenCalledWith('date_demande', { ascending: false });
});

test('addRequest inserts with user and mama_id', async () => {
  const { result } = renderHook(() => useValidations());
  await act(async () => { await result.current.addRequest({ action_type: 'a', table_cible: 't' }); });
  expect(queryObj.insert).toHaveBeenCalledWith([{ action_type: 'a', table_cible: 't', mama_id: 'm1', demandeur_id: 'u1', actif: true }]);
});

test('updateStatus updates reviewed fields', async () => {
  const { result } = renderHook(() => useValidations());
  await act(async () => { await result.current.updateStatus('id1', 'approved'); });
  expect(queryObj.update).toHaveBeenCalledWith({ statut: 'approved', valideur_id: 'u1', date_validation: expect.any(String) });
  expect(queryObj.eq).toHaveBeenCalledWith('id', 'id1');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('actif', true);
});
