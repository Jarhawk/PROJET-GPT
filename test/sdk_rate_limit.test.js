import { describe, it, expect, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';

describe('MamaStockSDK fetchData retries on rate limit', () => {
  
  it('retries when server returns 429', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) });
    global.fetch = fetchMock;
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    sdk.handleRateLimit = vi.fn();
    const data = await sdk.fetchData('/foo');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data).toEqual({ ok: true });
  });

  it('fails after retries are exhausted', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false, status: 503 }));
    global.fetch = fetchMock;
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    sdk.handleRateLimit = vi.fn();
    const err = await sdk.fetchData('/foo', {}, 2).catch((e) => e);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(err).toBeInstanceOf(Error);
  });

  it('uses retryAttempts option by default', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) });
    global.fetch = fetchMock;
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', retryAttempts: 2 });
    sdk.handleRateLimit = vi.fn();
    const data = await sdk.fetchData('/foo');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data).toEqual({ ok: true });
  });

  it('passes retryDelayMs to handleRateLimit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      });
    global.fetch = fetchMock;
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', retryDelayMs: 2000 });
    sdk.handleRateLimit = vi.fn();
    await sdk.fetchData('/foo');
    expect(sdk.handleRateLimit).toHaveBeenCalledWith(2000);
  });

  it('increments delay after each retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) });
    global.fetch = fetchMock;
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', retryAttempts: 3, retryDelayMs: 1000 });
    sdk.handleRateLimit = vi.fn();
    await sdk.fetchData('/foo');
    expect(sdk.handleRateLimit).toHaveBeenNthCalledWith(1, 1000);
    expect(sdk.handleRateLimit).toHaveBeenNthCalledWith(2, 2000);
  });
});
