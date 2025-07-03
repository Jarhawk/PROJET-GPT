import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getProduits } from '../lib/mamastock-sdk/produits.ts';

const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

describe('MamaStockSDK userAgent from env', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('reads userAgent from MAMASTOCK_USER_AGENT', async () => {
    process.env.MAMASTOCK_BASE_URL = 'https://env-api';
    process.env.MAMASTOCK_USER_AGENT = 'EnvAgent';
    const sdk = new MamaStockSDK({});
    await getProduits(sdk, {});
    expect(fetchMock).toHaveBeenCalledWith(
      'https://env-api/api/public/v1/produits',
      expect.objectContaining({ headers: { 'User-Agent': 'EnvAgent' } })
    );
    delete process.env.MAMASTOCK_BASE_URL;
    delete process.env.MAMASTOCK_USER_AGENT;
  });
});
