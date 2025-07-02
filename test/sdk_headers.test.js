// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getProduits } from '../lib/mamastock-sdk/produits.ts';

const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

describe('MamaStockSDK', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('adds api key and bearer token headers', async () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', apiKey: 'k', token: 't' });
    await getProduits(sdk, { mamaId: 'm1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api/api/public/v1/produits?mama_id=m1',
      expect.objectContaining({
        headers: {
          'x-api-key': 'k',
          Authorization: 'Bearer t',
          'User-Agent': 'MamaStockSDK',
        },
      }),
    );
  });

  it('allows overriding the user agent', async () => {
    const sdk = new MamaStockSDK({
      baseUrl: 'https://api',
      userAgent: 'TestAgent',
    });
    await getProduits(sdk, {});
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api/api/public/v1/produits',
      expect.objectContaining({ headers: { 'User-Agent': 'TestAgent' } }),
    );
  });
});
