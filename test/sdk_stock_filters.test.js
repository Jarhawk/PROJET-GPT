import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getStock } from '../lib/mamastock-sdk/stock.ts';

const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

describe('getStock options', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('serialises all filters', async () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    await getStock(sdk, {
      mamaId: 'm1',
      since: '2024-01-01',
      type: 'entree',
      zone: 'frigo',
      page: 2,
      limit: 50,
      sortBy: 'date',
      order: 'desc',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api/api/public/v1/stock?mama_id=m1&since=2024-01-01&type=entree&zone=frigo&page=2&limit=50&sortBy=date&order=desc',
      expect.any(Object),
    );
  });
});
