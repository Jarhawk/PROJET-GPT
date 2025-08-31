// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const orderMock = vi.fn(() => Promise.resolve({ data: [{ id: 'p1' }], error: null }));
const lteMock = vi.fn(() => ({ order: orderMock }));
const gteMock = vi.fn(() => ({ lte: lteMock, order: orderMock }));
const eqMock = vi.fn(() => ({ eq: eqMock, gte: gteMock, lte: lteMock, order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock, gte: gteMock, lte: lteMock, order: orderMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('@/hooks/useAuditLog', () => ({ useAuditLog: () => ({ log: vi.fn() }) }));

let usePertes;

beforeEach(async () => {
  ({ usePertes } = await import('@/hooks/usePertes'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  gteMock.mockClear();
  lteMock.mockClear();
  orderMock.mockClear();
});

test('fetchPertes retrieves data', async () => {
  const { result } = renderHook(() => usePertes());
  await act(async () => { await result.current.fetchPertes(); });
  expect(fromMock).toHaveBeenCalledWith('pertes');
    expect(selectMock).toHaveBeenCalledWith('id, produit_id, date_perte, quantite, motif, produit:produit_id(nom)');
    expect(eqMock).toHaveBeenNthCalledWith(1, 'mama_id', 'm1');
    expect(eqMock).toHaveBeenNthCalledWith(2, 'produit.mama_id', 'm1');
  expect(orderMock).toHaveBeenCalledWith('date_perte', { ascending: false });
  expect(result.current.pertes).toEqual([{ id: 'p1' }]);
});
