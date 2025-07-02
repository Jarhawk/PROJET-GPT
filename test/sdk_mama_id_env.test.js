import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getProduits } from '../lib/mamastock-sdk/produits.ts';

const fetchMock = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
);

describe('MamaStockSDK mamaId from env', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('reads mamaId from MAMASTOCK_MAMA_ID', async () => {
    process.env.MAMASTOCK_BASE_URL = 'https://env-api';
    process.env.MAMASTOCK_MAMA_ID = 'env-mama';
    const sdk = new MamaStockSDK({});
    await getProduits(sdk);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://env-api/api/public/v1/produits?mama_id=env-mama',
      expect.any(Object)
    );
    delete process.env.MAMASTOCK_BASE_URL;
    delete process.env.MAMASTOCK_MAMA_ID;
  });
});
