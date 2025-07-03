import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';

const fetchMock = vi
  .fn()
  .mockResolvedValueOnce({ ok: false, status: 429 })
  .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) });

describe('MamaStockSDK retry options from env', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('reads retry options from environment', async () => {
    process.env.MAMASTOCK_BASE_URL = 'https://env-api';
    process.env.MAMASTOCK_RETRY_ATTEMPTS = '5';
    process.env.MAMASTOCK_RETRY_DELAY_MS = '200';
    const sdk = new MamaStockSDK({});
    sdk.handleRateLimit = vi.fn();
    await sdk.fetchData('/foo');
    expect(sdk.retryAttempts).toBe(5);
    expect(sdk.retryDelayMs).toBe(200);
    expect(sdk.handleRateLimit).toHaveBeenCalledWith(200);
    delete process.env.MAMASTOCK_BASE_URL;
    delete process.env.MAMASTOCK_RETRY_ATTEMPTS;
    delete process.env.MAMASTOCK_RETRY_DELAY_MS;
  });

  it('ignores invalid retry env values', async () => {
    process.env.MAMASTOCK_BASE_URL = 'https://env-api';
    process.env.MAMASTOCK_RETRY_ATTEMPTS = '0';
    process.env.MAMASTOCK_RETRY_DELAY_MS = '-5';
    const sdk = new MamaStockSDK({});
    expect(sdk.retryAttempts).toBe(3);
    expect(sdk.retryDelayMs).toBe(1000);
    delete process.env.MAMASTOCK_BASE_URL;
    delete process.env.MAMASTOCK_RETRY_ATTEMPTS;
    delete process.env.MAMASTOCK_RETRY_DELAY_MS;
  });
});
