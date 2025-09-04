// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  order: vi.fn(() => query),
  eq: vi.fn(() => query),
  ilike: vi.fn(() => query),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => query);
const rpcMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, rpc: rpcMock } }));
const csvMock = vi.fn();
vi.mock('@/lib/export/exportHelpers', () => ({ exportToCSV: csvMock }));

const authMock = vi.fn(() => ({ mama_id: 'm1', isSuperadmin: false }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: authMock }));

let useUtilisateurs;

beforeEach(async () => {
  ({ useUtilisateurs } = await import('@/hooks/useUtilisateurs'));
  fromMock.mockClear();
  rpcMock.mockClear();
  query.select.mockClear();
  query.order.mockClear();
  query.eq.mockClear();
  query.ilike.mockClear();
  csvMock.mockClear();
});

test('getUtilisateurs applies filters', async () => {
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.getUtilisateurs({ search: 'foo', actif: true });
  });
  expect(fromMock).toHaveBeenCalledWith('utilisateurs_complets');
  expect(query.select).toHaveBeenCalledWith('*');
  expect(query.order).toHaveBeenCalledWith('nom', { ascending: true });
  expect(query.eq.mock.calls).toContainEqual(['mama_id', 'm1']);
  expect(query.ilike).toHaveBeenCalledWith('nom', '%foo%');
  expect(query.eq.mock.calls).toContainEqual(['actif', true]);
});

test('createUtilisateur uses rpc', async () => {
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.createUtilisateur({ email: 'a', nom: 'A', role_id: 'r1' });
  });
  expect(rpcMock).toHaveBeenCalledWith('create_utilisateur', expect.objectContaining({ email: 'a', nom: 'A', role_id: 'r1', mama_id: 'm1' }));
});

test('superadmin can set mama_id', async () => {
  authMock.mockReturnValueOnce({ mama_id: null, isSuperadmin: true });
  ({ useUtilisateurs } = await import('@/hooks/useUtilisateurs'));
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.createUtilisateur({ email: 'b', nom: 'B', role_id: 'r1', mama_id: 'm2' });
  });
  expect(rpcMock).toHaveBeenCalledWith('create_utilisateur', expect.objectContaining({ mama_id: 'm2' }));
});

test('exportUsersToCSV calls helper', () => {
  const { result } = renderHook(() => useUtilisateurs());
  result.current.exportUsersToCSV([{ id: 1 }]);
  expect(csvMock).toHaveBeenCalledWith([{ id: 1 }], { filename: 'utilisateurs_mamastock.csv' });
});
