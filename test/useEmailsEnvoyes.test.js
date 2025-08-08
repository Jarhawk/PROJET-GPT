// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const final = { then: (fn) => fn({ data: [{ id: 'e1' }], count: 1, error: null }) };
const selectMock = vi.fn(() => builder);
const eqMock = vi.fn(() => builder);
const ilikeMock = vi.fn(() => builder);
const gteMock = vi.fn(() => builder);
const lteMock = vi.fn(() => builder);
const orderMock = vi.fn(() => builder);
const rangeMock = vi.fn(() => builder);
const builder = {
  select: (...args) => { selectMock(...args); return builder; },
  eq: (...args) => { eqMock(...args); return builder; },
  ilike: (...args) => { ilikeMock(...args); return builder; },
  gte: (...args) => { gteMock(...args); return builder; },
  lte: (...args) => { lteMock(...args); return builder; },
  order: (...args) => { orderMock(...args); return builder; },
  range: (...args) => { rangeMock(...args); return builder; },
  then: final.then,
};

const fromMock = vi.fn(() => builder);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let useEmailsEnvoyes;

beforeEach(async () => {
  ({ useEmailsEnvoyes } = await import('@/hooks/useEmailsEnvoyes'));
  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  ilikeMock.mockClear();
  gteMock.mockClear();
  lteMock.mockClear();
  orderMock.mockClear();
  rangeMock.mockClear();
});

test('fetchEmails queries emails_envoyes with filters', async () => {
  const { result } = renderHook(() => useEmailsEnvoyes());
  await act(async () => {
    await result.current.fetchEmails({
      statut: 'success',
      email: 'test',
      commande_id: 'c1',
      date_start: '2024-01-01',
      date_end: '2024-01-02',
    });
  });
  expect(fromMock).toHaveBeenCalledWith('emails_envoyes');
  expect(selectMock).toHaveBeenCalled();
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(orderMock).toHaveBeenCalledWith('envoye_le', { ascending: false });
  expect(rangeMock).toHaveBeenCalledWith(0, 49);
  expect(eqMock).toHaveBeenCalledWith('statut', 'success');
  expect(ilikeMock).toHaveBeenCalledWith('email', '%test%');
  expect(eqMock).toHaveBeenCalledWith('commande_id', 'c1');
  expect(gteMock).toHaveBeenCalledWith('envoye_le', '2024-01-01');
  expect(lteMock).toHaveBeenCalledWith('envoye_le', '2024-01-02');
  expect(result.current.emails).toEqual([{ id: 'e1' }]);
});
