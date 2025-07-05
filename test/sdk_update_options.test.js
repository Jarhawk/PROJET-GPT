import { describe, it, expect, vi } from 'vitest';
import { MamaStockSDK } from '../lib/mamastock-sdk/index.ts';

describe('MamaStockSDK updateOptions', () => {
  it('updates properties', () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', apiKey: 'k' });
    const res = sdk.updateOptions({ token: 't', mamaId: 'm', baseUrl: 'https://new' });
    expect(sdk.token).toBe('t');
    expect(sdk.mamaId).toBe('m');
    expect(sdk.baseUrl).toBe('https://new');
    expect(res).toBe(sdk);
  });

  it('validates baseUrl', () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    expect(() => sdk.updateOptions({ baseUrl: 'ftp://x' })).toThrow();
  });

  it('validates fetch type', () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    expect(() => sdk.updateOptions({ fetch: 123 })).toThrow();
  });

  it('clearAuth resets credentials', () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api', apiKey: 'k', token: 't' });
    const res = sdk.clearAuth();
    expect(sdk.apiKey).toBeUndefined();
    expect(sdk.token).toBeUndefined();
    expect(res).toBe(sdk);
  });

  it('setAuth updates credentials', () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    const res = sdk.setAuth({ apiKey: 'a', token: 'b' });
    expect(sdk.apiKey).toBe('a');
    expect(sdk.token).toBe('b');
    expect(res).toBe(sdk);
  });

  it('setHeaders merges headers', async () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    );
    sdk.fetch = fetchMock;
    sdk.setHeaders({ A: '1' }).setHeaders({ B: '2' });
    await sdk.fetchData('/test');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api/test',
      expect.objectContaining({
        headers: expect.objectContaining({ A: '1', B: '2' }),
      }),
    );
  });

  it('removeHeaders deletes headers', async () => {
    const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    );
    sdk.fetch = fetchMock;
    sdk.setHeaders({ A: '1', B: '2' });
    sdk.removeHeaders('A');
    await sdk.fetchData('/t');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api/t',
      expect.objectContaining({
        headers: expect.not.objectContaining({ A: '1' }),
      }),
    );
  });
});
