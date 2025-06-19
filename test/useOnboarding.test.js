import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  single: vi.fn(() => queryObj),
  upsert: vi.fn(() => queryObj),
  then: (fn) => Promise.resolve(fn({ data: { step: 1 }, error: null })),
};
const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1', user: { id: 'u1' } }) }));

let useOnboarding;

beforeEach(async () => {
  ({ useOnboarding } = await import('@/hooks/useOnboarding'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.single.mockClear();
  queryObj.upsert.mockClear();
});

test('fetchProgress queries table', async () => {
  const { result } = renderHook(() => useOnboarding());
  await act(async () => { await result.current.fetchProgress(); });
  expect(fromMock).toHaveBeenCalledWith('onboarding_progress');
  expect(queryObj.select).toHaveBeenCalledWith('step');
  expect(queryObj.eq).toHaveBeenCalledWith('user_id', 'u1');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
});

test('saveStep upserts progress', async () => {
  const { result } = renderHook(() => useOnboarding());
  await act(async () => { await result.current.saveStep(2); });
  expect(queryObj.upsert).toHaveBeenCalledWith({ user_id: 'u1', mama_id: 'm1', step: 2 });
});
