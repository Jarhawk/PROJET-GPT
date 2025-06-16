import { vi, expect, test } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInvoiceOcr } from '@/hooks/useInvoiceOcr';
import { createWorker } from 'tesseract.js';

vi.mock('tesseract.js', () => ({ createWorker: vi.fn() }));

const fakeWorker = {
  loadLanguage: vi.fn(),
  initialize: vi.fn(),
  recognize: vi.fn(async () => ({ data: { text: 'OK' } })),
  terminate: vi.fn(),
};

createWorker.mockResolvedValue(fakeWorker);

test('scan uses tesseract and returns text', async () => {
  const file = new Blob(['test']);
  const { result } = renderHook(() => useInvoiceOcr());
  await act(async () => {
    const text = await result.current.scan(file);
    expect(text).toBe('OK');
  });
  expect(fakeWorker.recognize).toHaveBeenCalled();
});
