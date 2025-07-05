import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getPromotions } from '../lib/mamastock-sdk/promotions.ts';

const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

describe('getPromotions options', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('serialises all filters', async () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    await getPromotions(sdk, {
      mamaId: 'm1',
      search: 'summer',
      actif: true,
      page: 2,
      limit: 20,
      sortBy: 'date_debut',
      order: 'asc',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api/api/public/v1/promotions?mama_id=m1&search=summer&actif=true&page=2&limit=20&sortBy=date_debut&order=asc',
      expect.any(Object),
    );
  });
});
