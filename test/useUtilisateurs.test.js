// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const query = {
  select: vi.fn(() => query),
  order: vi.fn(() => query),
  eq: vi.fn(() => query),
  ilike: vi.fn(() => query),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  delete: vi.fn(() => query),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
const csvMock = vi.fn();
vi.mock('@/lib/export/exportHelpers', () => ({ exportToCSV: csvMock }));

const authMock = vi.fn(() => ({ mama_id: 'm1', role: 'admin' }));
vi.mock('@/context/AuthContext', () => ({ useAuth: authMock }));

let useUtilisateurs;

beforeEach(async () => {
  ({ useUtilisateurs } = await import('@/hooks/useUtilisateurs'));
  fromMock.mockClear();
  query.select.mockClear();
  query.order.mockClear();
  query.eq.mockClear();
  query.ilike.mockClear();
  query.insert.mockClear();
  query.update.mockClear();
  query.delete.mockClear();
});

test('fetchUsers applies filters', async () => {
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.fetchUsers({ search: 'foo', actif: true, filterRole: 'admin' });
  });
  expect(fromMock).toHaveBeenCalledWith('utilisateurs');
  expect(query.select).toHaveBeenCalledWith('id, nom, actif, mama_id, role_id, role:roles(nom), access_rights');
  expect(query.order).toHaveBeenCalledWith('nom', { ascending: true });
  expect(query.eq.mock.calls).toContainEqual(['mama_id', 'm1']);
  expect(query.ilike).toHaveBeenCalledWith('nom', '%foo%');
  expect(query.eq.mock.calls).toContainEqual(['roles.nom', 'admin']);
  expect(query.eq.mock.calls).toContainEqual(['actif', true]);
});

test('addUser inserts with current mama_id', async () => {
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.addUser({ email: 'a' });
  });
  expect(query.insert).toHaveBeenCalledWith([{ email: 'a', mama_id: 'm1' }]);
});

test('superadmin bypasses mama filter', async () => {
  authMock.mockReturnValueOnce({ mama_id: null, role: 'superadmin' });
  ({ useUtilisateurs } = await import('@/hooks/useUtilisateurs'));
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.addUser({ email: 'b', mama_id: 'm2' });
    await result.current.updateUser('id1', { role: 'user' });
  });
  expect(query.insert).toHaveBeenCalledWith([{ email: 'b', mama_id: 'm2' }]);
  expect(query.update).toHaveBeenCalledWith({ role: 'user' });
  expect(query.eq).toHaveBeenCalledWith('id', 'id1');
  expect(query.eq.mock.calls.some(c => c[0] === 'mama_id')).toBe(false);
});

test('exportUsersToCSV calls helper', () => {
  const { result } = renderHook(() => useUtilisateurs());
  result.current.exportUsersToCSV([{ id: 1 }]);
  expect(csvMock).toHaveBeenCalledWith([{ id: 1 }], { filename: 'utilisateurs_mamastock.csv' });
});
