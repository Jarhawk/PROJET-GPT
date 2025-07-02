import { describe, it, expect, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';

vi.useFakeTimers();

describe('MamaStockSDK abort signal', () => {
  it('aborts when provided signal fires', async () => {
    const fetchMock = vi.fn((url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })
    );
    const controller = new AbortController();
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', fetch: fetchMock, retryAttempts: 1, timeoutMs: 1000 });
    const promise = sdk.fetchData('/foo', {}, undefined, undefined, undefined, controller.signal).catch((e) => e);
    controller.abort();
    await vi.runAllTicks();
    const err = await promise;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Request aborted');
  });
});
