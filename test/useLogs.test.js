// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryExec = { then: fn => fn({ data: [{ id: 'l1' }], error: null }) };
const ilikeMock = vi.fn(() => queryExec);
const lteMock = vi.fn(() => queryExec);
const gteMock = vi.fn(() => ({ lte: lteMock, then: queryExec.then }));
const rangeMock = vi.fn(() => ({ ilike: ilikeMock, gte: gteMock, lte: lteMock, then: queryExec.then }));
const orderMock = vi.fn(() => ({ range: rangeMock }));
const eqMock = vi.fn(() => ({ order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
const authMock = vi.fn(() => ({ mama_id: 'm1' }));
vi.mock('@/context/AuthContext', () => ({ useAuth: authMock }));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('xlsx', () => ({ utils: { book_new: vi.fn(() => ({})), book_append_sheet: vi.fn(), json_to_sheet: vi.fn(() => ({})) }, write: vi.fn(() => new ArrayBuffer(10)) }));

let useLogs;

beforeEach(async () => {
  ({ useLogs } = await import('@/hooks/useLogs'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  orderMock.mockClear();
  ilikeMock.mockClear();
  rangeMock.mockClear();
});

test('fetchLogs queries journaux_utilisateur', async () => {
  const { result } = renderHook(() => useLogs());
  await act(async () => { await result.current.fetchLogs({ search: 'TEST' }); });
  expect(fromMock).toHaveBeenCalledWith('journaux_utilisateur');
  expect(selectMock).toHaveBeenCalledWith('*, utilisateurs:done_by(nom)');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
  expect(ilikeMock).toHaveBeenCalledWith('action', '%TEST%');
  expect(rangeMock).toHaveBeenCalledWith(0, 99);
  expect(result.current.logs).toEqual([{ id: 'l1' }]);
});

test('fetchLogs skips when no mama_id', async () => {
  authMock.mockReturnValueOnce({ mama_id: null });
  const { result } = renderHook(() => useLogs());
  await act(async () => { await result.current.fetchLogs(); });
  expect(fromMock).not.toHaveBeenCalled();
});

test('fetchLogs applies date filters', async () => {
  const { result } = renderHook(() => useLogs());
  await act(async () => { await result.current.fetchLogs({ startDate: '2024-01-01', endDate: '2024-02-01' }); });
  expect(gteMock).toHaveBeenCalledWith('created_at', '2024-01-01');
  expect(lteMock).toHaveBeenCalledWith('created_at', '2024-02-01');
});


test('exportLogsToExcel writes file', async () => {
  const { result } = renderHook(() => useLogs());
  await act(async () => { await result.current.fetchLogs(); });
  await act(() => { result.current.exportLogsToExcel(); });
  const { saveAs } = await import('file-saver');
  const XLSX = await import('xlsx');
  expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
  expect(saveAs).toHaveBeenCalled();
});


