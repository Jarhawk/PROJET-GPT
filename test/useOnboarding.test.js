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
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useOnboarding;

beforeEach(async () => {
  ({ useOnboarding } = await import('@/hooks/useOnboarding'));
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
  expect(queryObj.select).toHaveBeenCalledWith('etape, terminee');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.order).toHaveBeenCalledWith('created_at', { ascending: true });
});

test('startOnboarding inserts row', async () => {
  const { result } = renderHook(() => useOnboarding());
  await act(async () => { await result.current.startOnboarding(); });
  expect(queryObj.insert).toHaveBeenCalledWith([{ mama_id: 'm1', etape: '0', terminee: false }]);
});
