import { describe, it, expect, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';

describe('MamaStockSDK fetch option', () => {
  it('uses provided fetch implementation', async () => {
    const customFetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', fetch: customFetch });
    await sdk.fetchData('/test');
    expect(customFetch).toHaveBeenCalled();
  });
});
