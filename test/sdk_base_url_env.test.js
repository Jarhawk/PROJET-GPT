import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';
import { getProduits } from '../lib/mamastock-sdk/produits.ts';

const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

describe('MamaStockSDK baseUrl from env', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    global.fetch = fetchMock;
  });

  it('reads baseUrl from MAMASTOCK_BASE_URL', async () => {
    process.env.MAMASTOCK_BASE_URL = 'https://env-api';
    const sdk = new MamaStockSDK({});
    await getProduits(sdk, { mamaId: 'm1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://env-api/api/public/v1/produits?mama_id=m1',
      expect.any(Object)
    );
    delete process.env.MAMASTOCK_BASE_URL;
  });

  it('throws when baseUrl missing', () => {
    delete process.env.MAMASTOCK_BASE_URL;
    expect(() => new MamaStockSDK({})).toThrow('Missing baseUrl');
  });

  it('throws when baseUrl invalid', () => {
    process.env.MAMASTOCK_BASE_URL = 'ftp://api';
    expect(() => new MamaStockSDK({})).toThrow('Invalid baseUrl');
    delete process.env.MAMASTOCK_BASE_URL;
  });
});
