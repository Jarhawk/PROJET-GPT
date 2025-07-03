import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getProduits } from '../lib/mamastock-sdk/produits.ts';

const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

describe('MamaStockSDK default mamaId', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('uses sdk.mamaId when no option provided', async () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', mamaId: 'm2' });
    await getProduits(sdk);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api/api/public/v1/produits?mama_id=m2',
      expect.any(Object)
    );
  });
});
