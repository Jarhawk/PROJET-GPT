import { describe, it, expect, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';

vi.useFakeTimers();

describe('MamaStockSDK timeout from env', () => {
  it('reads timeout from MAMASTOCK_TIMEOUT_MS', async () => {
    process.env.MAMASTOCK_BASE_URL = 'https://env-api';
    process.env.MAMASTOCK_TIMEOUT_MS = '50';
    const fetchMock = vi.fn((url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      })
    );
    const sdk = new MamaStockSDK({ fetch: fetchMock, retryAttempts: 1 });
    const promise = sdk.fetchData('/foo').catch((e) => e);
    await vi.advanceTimersByTimeAsync(51);
    await vi.runAllTicks();
    const err = await promise;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Request timed out');
    delete process.env.MAMASTOCK_BASE_URL;
    delete process.env.MAMASTOCK_TIMEOUT_MS;
  });

  it('ignores invalid timeout env value', () => {
    process.env.MAMASTOCK_BASE_URL = 'https://env-api';
    process.env.MAMASTOCK_TIMEOUT_MS = '0';
    const sdk = new MamaStockSDK({});
    expect(sdk.timeoutMs).toBe(10000);
    delete process.env.MAMASTOCK_BASE_URL;
    delete process.env.MAMASTOCK_TIMEOUT_MS;
  });
});
