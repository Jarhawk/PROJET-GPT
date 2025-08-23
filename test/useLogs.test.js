// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryExec = { then: fn => fn({ data: [{ id: 'l1' }], error: null }) };
const orderMock = vi.fn(() => queryExec);
const eqMock = vi.fn(() => ({ order: orderMock, gte: gteMock, lte: lteMock, then: queryExec.then }));
const gteMock = vi.fn(() => ({ order: orderMock, eq: eqMock, lte: lteMock, then: queryExec.then }));
const lteMock = vi.fn(() => ({ order: orderMock, eq: eqMock, gte: gteMock, then: queryExec.then }));
const selectMock = vi.fn(() => ({ eq: eqMock, gte: gteMock, lte: lteMock, order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));
const rpcMock = vi.fn(() => ({ then: fn => fn({ data: null, error: null }) }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock, rpc: rpcMock } }));
const authMock = vi.fn(() => ({ mama_id: 'm1' }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: authMock }));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('xlsx', () => ({ utils: { book_new: vi.fn(() => ({})), book_append_sheet: vi.fn(), json_to_sheet: vi.fn(() => ({})) }, write: vi.fn(() => new ArrayBuffer(10)) }));
vi.mock('jspdf', () => ({ default: vi.fn(() => ({ save: vi.fn() })) }));
vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

let useLogs;

beforeEach(async () => {
  ({ useLogs } = await import('@/hooks/useLogs'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  orderMock.mockClear();
  rpcMock.mockClear();
});

test('fetchLogs queries logs_activite', async () => {
  const { result } = renderHook(() => useLogs());
  await act(async () => { await result.current.fetchLogs({ type: 'login' }); });
  expect(fromMock).toHaveBeenCalledWith('logs_activite');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(result.current.logs).toEqual([{ id: 'l1' }]);
});

test('logAction calls rpc', async () => {
  const { result } = renderHook(() => useLogs());
  await act(async () => {
    await result.current.logAction({ type: 'login', module: 'm', description: 'd' });
  });
  expect(rpcMock).toHaveBeenCalledWith('log_action', expect.objectContaining({ p_type: 'login' }));
});

test('exportLogs writes file', async () => {
  const { result } = renderHook(() => useLogs());
  await act(async () => { await result.current.fetchLogs(); });
  await act(async () => { await result.current.exportLogs('xlsx'); });
  const { saveAs } = await import('file-saver');
  expect(saveAs).toHaveBeenCalled();
});
