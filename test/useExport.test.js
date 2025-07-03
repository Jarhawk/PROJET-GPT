// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  gte: vi.fn(() => queryObj),
  lte: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [{ id: 1 }], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

const pdfMock = vi.fn();
const excelMock = vi.fn();
const csvMock = vi.fn();
const printMock = vi.fn();

vi.mock('@/lib/export/exportHelpers', () => ({
  exportToPDF: pdfMock,
  exportToExcel: excelMock,
  exportToCSV: csvMock,
  printView: printMock,
}));

let useExport;

beforeEach(async () => {
  ({ default: useExport } = await import('@/hooks/useExport'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.gte.mockClear();
  queryObj.lte.mockClear();
  pdfMock.mockClear();
  excelMock.mockClear();
  csvMock.mockClear();
  printMock.mockClear();
});

test('exportData queries factures with dates and calls Excel export', async () => {
  const { result } = renderHook(() => useExport());
  await act(async () => {
    await result.current.exportData({
      type: 'factures',
      format: 'excel',
      options: { start: '2024-01-01', end: '2024-12-31' },
    });
  });
  expect(fromMock).toHaveBeenCalledWith('factures');
  expect(queryObj.select).toHaveBeenCalled();
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.gte).toHaveBeenCalledWith('date', '2024-01-01');
  expect(queryObj.lte).toHaveBeenCalledWith('date', '2024-12-31');
  expect(excelMock).toHaveBeenCalled();
});
