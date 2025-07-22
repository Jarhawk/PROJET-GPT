// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const orderMock = vi.fn(() => Promise.resolve({ data: [{ id: 'c1' }], error: null }));
const ilikeMock = vi.fn(() => ({ order: orderMock }));
const eqMock = vi.fn(() => ({ ilike: ilikeMock, order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));
const sheetToJson = vi.fn(() => [{ nom: 'Food' }]);
let readMock = vi.fn(() => ({ SheetNames: ['CostCenters'], Sheets: { CostCenters: {} } }));
vi.mock('xlsx', () => ({ read: (...args) => readMock(...args), utils: { sheet_to_json: sheetToJson } }), { virtual: true });

let useCostCenters;

beforeEach(async () => {
  ({ useCostCenters } = await import('@/hooks/useCostCenters'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  ilikeMock.mockClear();
  orderMock.mockClear();
});

test('fetchCostCenters retrieves data', async () => {
  const { result } = renderHook(() => useCostCenters());
  await act(async () => {
    await result.current.fetchCostCenters();
  });
  expect(fromMock).toHaveBeenCalledWith('centres_de_cout');
  expect(selectMock).toHaveBeenCalledWith('*');
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(orderMock).toHaveBeenCalledWith('nom', { ascending: true });
  expect(result.current.costCenters).toEqual([{ id: 'c1' }]);
});

test('importCostCentersFromExcel parses rows', async () => {
  ({ useCostCenters } = await import('@/hooks/useCostCenters'));
  const file = { arrayBuffer: vi.fn(async () => new ArrayBuffer(8)) };
  const { result } = renderHook(() => useCostCenters());
  let rows;
  await act(async () => {
    rows = await result.current.importCostCentersFromExcel(file);
  });
  expect(file.arrayBuffer).toHaveBeenCalled();
  expect(readMock).toHaveBeenCalled();
  expect(sheetToJson).toHaveBeenCalled();
  expect(rows).toEqual([{ nom: 'Food' }]);
});

test('importCostCentersFromExcel falls back to first sheet', async () => {
  readMock = vi.fn(() => ({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } }));
  ({ useCostCenters } = await import('@/hooks/useCostCenters'));
  const file = { arrayBuffer: vi.fn(async () => new ArrayBuffer(8)) };
  const { result } = renderHook(() => useCostCenters());
  let rows;
  await act(async () => {
    rows = await result.current.importCostCentersFromExcel(file);
  });
  expect(readMock).toHaveBeenCalled();
  expect(sheetToJson).toHaveBeenCalled();
  expect(rows).toEqual([{ nom: 'Food' }]);
});
