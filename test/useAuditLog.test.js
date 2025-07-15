// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const insertMock = vi.fn(() => Promise.resolve({ error: null }));
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock }, }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1', user: { id: 'u1' } }) }));

let useAuditLog;

beforeEach(async () => {
  ({ useAuditLog } = await import('@/hooks/useAuditLog'));
  fromMock.mockClear();
  insertMock.mockClear();
});

test('log inserts into journaux_utilisateur', async () => {
  const { result } = renderHook(() => useAuditLog());
  await act(async () => {
    await result.current.log('TEST', { foo: 'bar' });
  });
  expect(fromMock).toHaveBeenCalledWith('journaux_utilisateur');
  expect(insertMock).toHaveBeenCalledWith([
    { mama_id: 'm1', user_id: 'u1', action: 'TEST', details: { foo: 'bar' }, done_by: 'u1' },
  ]);
});
