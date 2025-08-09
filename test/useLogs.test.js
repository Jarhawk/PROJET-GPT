// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const fromMock = vi.fn();
const selectMock = vi.fn();
const eqMock = vi.fn();
const orderMock = vi.fn();
const rpcMock = vi.fn();

const supabaseMock = {
  from: fromMock,
  rpc: rpcMock,
};

vi.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));
const authMock = vi.fn(() => ({ mama_id: 'm1' }));
vi.mock('@/hooks/useAuth', () => ({ default: authMock }));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('xlsx', () => ({ utils: { book_new: vi.fn(() => ({})), book_append_sheet: vi.fn(), json_to_sheet: vi.fn(() => ({})) }, write: vi.fn(() => new ArrayBuffer(10)) }));

let useLogs;

beforeEach(async () => {
  ({ useLogs } = await import('@/hooks/useLogs'));
  fromMock.mockReset();
  selectMock.mockReset();
  eqMock.mockReset();
  orderMock.mockReset();
  rpcMock.mockReset();
  fromMock.mockReturnValue({ select: selectMock });
  selectMock.mockReturnValue({ eq: eqMock });
  eqMock.mockReturnValue({ eq: eqMock, order: orderMock, gte: eqMock, lte: eqMock });
  orderMock.mockReturnValue({});
});

test('fetchLogs queries logs_activite', async () => {
  orderMock.mockResolvedValue({ data: [{ id: '1' }], error: null });
  const { result } = renderHook(() => useLogs());
  await act(async () => {
    await result.current.fetchLogs({ type: 'login' });
  });
  expect(fromMock).toHaveBeenCalledWith('logs_activite');
  expect(selectMock).toHaveBeenCalledWith('*');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(eqMock).toHaveBeenCalledWith('type', 'login');
  expect(orderMock).toHaveBeenCalledWith('date_log', { ascending: false });
  expect(result.current.logs).toEqual([{ id: '1' }]);
});

test('logAction calls rpc', async () => {
  const { result } = renderHook(() => useLogs());
  await act(async () => {
    await result.current.logAction({ type: 'login', module: 'auth', description: 'test' });
  });
  expect(rpcMock).toHaveBeenCalledWith('log_action', expect.objectContaining({ p_type: 'login' }));
});

test('fetchRapports queries rapports_generes', async () => {
  fromMock.mockReturnValueOnce({ select: selectMock });
  selectMock.mockReturnValueOnce({ eq: eqMock });
  eqMock.mockReturnValueOnce({ order: orderMock });
  orderMock.mockResolvedValueOnce({ data: [{ id: 'r1' }], error: null });
  const { result } = renderHook(() => useLogs());
  await act(async () => {
    await result.current.fetchRapports();
  });
  expect(fromMock).toHaveBeenCalledWith('rapports_generes');
  expect(result.current.rapports).toEqual([{ id: 'r1' }]);
});

test('exportLogs generates file', async () => {
  orderMock.mockResolvedValueOnce({ data: [{ id: '1', date_log: '2024-01-01', type: 't', module: 'm', description: 'd', critique: false }], error: null });
  const { result } = renderHook(() => useLogs());
  await act(async () => { await result.current.fetchLogs(); });
  await act(() => { result.current.exportLogs('xlsx'); });
  const XLSX = await import('xlsx');
  expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
});

