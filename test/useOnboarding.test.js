// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  insert: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({
  __esModule: true,
  supabase: { from: fromMock },
  default: { from: fromMock },
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1', user: { id: 'u1' } }) }));

let useOnboarding;

beforeEach(async () => {
  ({ default: useOnboarding } = await import('@/hooks/useOnboarding'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.order.mockClear();
  queryObj.insert.mockClear();
});

test('fetchProgress queries table', async () => {
  const { result } = renderHook(() => useOnboarding());
  await act(async () => { await result.current.fetchProgress(); });
  expect(fromMock).toHaveBeenCalledWith('etapes_onboarding');
  expect(queryObj.select).toHaveBeenCalledWith('etape, statut');
  expect(queryObj.eq).toHaveBeenCalledWith('user_id', 'u1');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.order).toHaveBeenCalledWith('created_at', { ascending: true });
});

test('startOnboarding inserts row', async () => {
  const { result } = renderHook(() => useOnboarding());
  await act(async () => { await result.current.startOnboarding(); });
  expect(queryObj.insert).toHaveBeenCalledWith([{ user_id: 'u1', mama_id: 'm1', etape: '0', statut: 'en cours' }]);
});
