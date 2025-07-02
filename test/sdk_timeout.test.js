import { describe, it, expect, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';

vi.useFakeTimers();

describe('MamaStockSDK timeout', () => {
  it('aborts request after timeoutMs', async () => {
    const fetchMock = vi.fn((url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      })
    );
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', fetch: fetchMock, retryAttempts: 1, timeoutMs: 50 });
    const promise = sdk.fetchData('/foo').catch((e) => e);
    await vi.advanceTimersByTimeAsync(51);
    await vi.runAllTicks();
    const err = await promise;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Request timed out');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
