import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getProduits } from '../lib/mamastock-sdk/produits.ts';

const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

describe('getProduits options', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('serialises all filters', async () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    await getProduits(sdk, {
      mamaId: 'm1',
      famille: 'bio',
      search: 'choc',
      actif: false,
      page: 2,
      limit: 50,
      sortBy: 'nom',
      order: 'desc',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api/api/public/v1/produits?mama_id=m1&famille=bio&search=choc&actif=false&page=2&limit=50&sortBy=nom&order=desc',
      expect.any(Object),
    );
  });
});
