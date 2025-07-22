import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => ({ then: fn => Promise.resolve(fn({ data: [], error: null })) })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useStockRequisitionne;

beforeEach(async () => {
  ({ useStockRequisitionne } = await import('@/hooks/useStockRequisitionne'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
});

test('fetchStock queries view with mama_id', async () => {
  const { result } = renderHook(() => useStockRequisitionne());
  await act(async () => { await result.current.fetchStock(); });
  expect(fromMock).toHaveBeenCalledWith('v_stock_requisitionne');
  expect(queryObj.select).toHaveBeenCalledWith('*');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
});
