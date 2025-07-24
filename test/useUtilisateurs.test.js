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
  upsert: vi.fn(() => query),
  delete: vi.fn(() => query),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => query);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
const csvMock = vi.fn();
vi.mock('@/lib/export/exportHelpers', () => ({ exportToCSV: csvMock }));

const authMock = vi.fn(() => ({ mama_id: 'm1', isSuperadmin: false }));
vi.mock('@/hooks/useAuth', () => ({ default: authMock }));

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
  query.upsert.mockClear();
  query.delete.mockClear();
});

test('fetchUsers applies filters', async () => {
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.fetchUsers({ search: 'foo', actif: true });
  });
  expect(fromMock).toHaveBeenCalledWith('utilisateurs_complets');
  expect(query.select).toHaveBeenCalledWith('*');
  expect(query.order).toHaveBeenCalledWith('nom', { ascending: true });
  expect(query.eq.mock.calls).toContainEqual(['mama_id', 'm1']);
  expect(query.ilike).toHaveBeenCalledWith('nom', '%foo%');
  expect(query.eq.mock.calls).toContainEqual(['actif', true]);
});

test('addUser inserts with current mama_id', async () => {
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.addUser({ email: 'a' });
  });
  expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({ email: 'a', mama_id: 'm1' }));
});

test('superadmin bypasses mama filter', async () => {
  authMock.mockReturnValueOnce({ mama_id: null, isSuperadmin: true });
  ({ useUtilisateurs } = await import('@/hooks/useUtilisateurs'));
  const { result } = renderHook(() => useUtilisateurs());
  await act(async () => {
    await result.current.addUser({ email: 'b', mama_id: 'm2' });
    await result.current.updateUser('id1', { role: 'user' });
  });
  expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({ email: 'b', mama_id: 'm2' }));
  expect(query.upsert).toHaveBeenCalledTimes(2);
});

test('exportUsersToCSV calls helper', () => {
  const { result } = renderHook(() => useUtilisateurs());
  result.current.exportUsersToCSV([{ id: 1 }]);
  expect(csvMock).toHaveBeenCalledWith([{ id: 1 }], { filename: 'utilisateurs_mamastock.csv' });
});
