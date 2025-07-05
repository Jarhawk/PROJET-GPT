import { describe, it, expect, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getProduits } from '../lib/mamastock-sdk/produits.ts';
import { getStock } from '../lib/mamastock-sdk/stock.ts';
import { getPromotions } from '../lib/mamastock-sdk/promotions.ts';

describe('SDK helpers signal option', () => {
  it('forwards AbortSignal to fetch', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
    const controller = new AbortController();
    global.fetch = fetchMock;
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    await getProduits(sdk, {}, controller.signal);
    await getStock(sdk, {}, controller.signal);
    await getPromotions(sdk, {}, controller.signal);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const call of fetchMock.mock.calls) {
      expect(call[1]).toMatchObject({ signal: controller.signal });
    }
  });
});
