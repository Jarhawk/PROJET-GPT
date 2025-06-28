import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const linesEq = vi.fn();
const linesQuery = { select: vi.fn(() => linesQuery), eq: linesEq };

const delEq = vi.fn();
const facturesQuery = { delete: vi.fn(() => facturesQuery), eq: delEq };

const fromMock = vi.fn((table) => {
  if (table === 'facture_lignes') return linesQuery;
  if (table === 'factures') return facturesQuery;
  return null;
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('@/hooks/useAuditLog', () => ({ useAuditLog: () => ({ log: vi.fn() }) }));

let useFactures;

beforeEach(async () => {
  ({ useFactures } = await import('@/hooks/useFactures'));
  fromMock.mockClear();
  linesQuery.select.mockClear();
  linesEq.mockClear();
  facturesQuery.delete.mockClear();
  delEq.mockClear();
});

test('deleteFacture aborts when lines exist', async () => {
  linesEq.mockReturnValueOnce(linesQuery).mockReturnValueOnce(Promise.resolve({ count: 1, error: null }));
  const { result } = renderHook(() => useFactures());
  let res;
  await act(async () => { res = await result.current.deleteFacture('f1'); });
  expect(fromMock).toHaveBeenCalledWith('facture_lignes');
  expect(facturesQuery.delete).not.toHaveBeenCalled();
  expect(res.error).toBe('Facture comporte des lignes');
});

test('deleteFacture proceeds when no lines', async () => {
  linesEq.mockReturnValueOnce(linesQuery).mockReturnValueOnce(Promise.resolve({ count: 0, error: null }));
  delEq.mockReturnValueOnce(facturesQuery).mockReturnValueOnce(Promise.resolve({ error: null }));
  const { result } = renderHook(() => useFactures());
  await act(async () => { await result.current.deleteFacture('f1'); });
  expect(facturesQuery.delete).toHaveBeenCalled();
});
