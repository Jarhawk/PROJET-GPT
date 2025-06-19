import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const rpcMock = vi.fn(() => Promise.resolve({ data: 'id1', error: null }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: rpcMock } }));

let useInvoiceImport;

beforeEach(async () => {
  ({ useInvoiceImport } = await import('@/hooks/useInvoiceImport'));
  rpcMock.mockClear();
});

test('importFromFile parses file and calls RPC', async () => {
  const file = { text: () => Promise.resolve(JSON.stringify({ a: 1 })) };
  const { result } = renderHook(() => useInvoiceImport());
  let id;
  await act(async () => { id = await result.current.importFromFile(file); });
  expect(rpcMock).toHaveBeenCalledWith('import_invoice', { payload: { a: 1 } });
  expect(id).toBe('id1');
});

test('importFromFile returns null on error', async () => {
  rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'bad' } });
  const file = { text: () => Promise.resolve('{}') };
  const { result } = renderHook(() => useInvoiceImport());
  let id;
  await act(async () => { id = await result.current.importFromFile(file); });
  expect(id).toBeNull();
});
