import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getProduits } from '../lib/mamastock-sdk/produits.ts';

const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

describe('MamaStockSDK auth from env', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('reads API key and token from environment', async () => {
    process.env.MAMASTOCK_BASE_URL = 'https://env-api';
    process.env.MAMASTOCK_API_KEY = 'env-key';
    process.env.MAMASTOCK_TOKEN = 'env-token';
    const sdk = new MamaStockSDK({});
    await getProduits(sdk, { mamaId: 'm1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://env-api/api/public/v1/produits?mama_id=m1',
      expect.objectContaining({
        headers: {
          'x-api-key': 'env-key',
          Authorization: 'Bearer env-token',
          'User-Agent': 'MamaStockSDK',
        },
      })
    );
    delete process.env.MAMASTOCK_BASE_URL;
    delete process.env.MAMASTOCK_API_KEY;
    delete process.env.MAMASTOCK_TOKEN;
  });
});
