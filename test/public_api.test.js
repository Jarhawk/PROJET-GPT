// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TABLES } from '@/constants/tables';

process.env.PUBLIC_API_KEY = 'dev_key';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

const data = [{ id: 'p1' }];

const chain = {
  eq: vi.fn(() => chain),
  gte: vi.fn(() => chain),
  order: vi.fn(() => chain),
  or: vi.fn(() => chain),
  limit: vi.fn(() => Promise.resolve({ data, error: null })),
  ilike: vi.fn(() => chain),
  range: vi.fn(() => Promise.resolve({ data, error: null })),
};
const selectMock = vi.fn(() => chain);
const fromMock = vi.fn(() => ({ select: selectMock }));
const getUserMock = vi.fn();
const rangeMock = chain.range;

let createClientMock;
vi.mock('@supabase/supabase-js', () => ({
  createClient: (createClientMock = vi.fn(() => ({
    from: fromMock,
    auth: { getUser: getUserMock },
  }))),
}));

let router;

beforeEach(async () => {
  router = (await import('../src/api/public/index.js')).default;
  fromMock.mockClear();
  selectMock.mockClear();
  chain.eq.mockClear();
  chain.gte.mockClear();
  chain.order.mockClear();
  chain.or.mockClear();
  chain.limit.mockClear();
  chain.ilike.mockClear();
  chain.range.mockClear();
  getUserMock.mockClear();
});

describe('public API router', () => {
  it('returns 401 when missing API key', async () => {
    const app = express();
    app.use(router);
    const res = await request(app).get('/produits?mama_id=m1');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 with invalid API key', async () => {
    const app = express();
    app.use(router);
    const res = await request(app)
      .get('/produits?mama_id=m1')
      .set('x-api-key', 'bad');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('fetches products with valid API key', async () => {
    const app = express();
    app.use(router);
    const res = await request(app).get('/produits?mama_id=m1').set('x-api-key', 'dev_key');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(data);
    expect(fromMock).toHaveBeenCalledWith('v_produits_dernier_prix');
  });

  it('applies famille filter when provided', async () => {
    const app = express();
    app.use(router);
    await request(app).get('/produits?mama_id=m1&famille=bio').set('x-api-key', 'dev_key');
    expect(chain.ilike).toHaveBeenCalledWith('famille', '%bio%');
  });

  it('supports search and actif filters with pagination', async () => {
    const app = express();
    app.use(router);
    await request(app)
      .get('/produits?mama_id=m1&search=choc&actif=false&page=2&limit=20')
      .set('x-api-key', 'dev_key');
    expect(chain.or).toHaveBeenCalledWith('nom.ilike.%choc%,code.ilike.%choc%');
    expect(chain.eq).toHaveBeenCalledWith('actif', false);
    expect(chain.range).toHaveBeenCalledWith(20, 39);
  });

  it('avoids duplicate order when sorting by nom', async () => {
    const app = express();
    app.use(router);
    await request(app)
      .get('/produits?mama_id=m1&sortBy=nom')
      .set('x-api-key', 'dev_key');
    expect(chain.order).toHaveBeenCalledTimes(1);
    expect(chain.order).toHaveBeenCalledWith('nom', { ascending: true });
  });

  it('returns 400 when mama_id is missing', async () => {
    const app = express();
    app.use(router);
    await request(app).get('/produits').set('x-api-key', 'dev_key').expect(400);
  });

  it('fetches products with bearer token', async () => {
    getUserMock.mockResolvedValue({ data: { user: { user_metadata: { mama_id: 'm2' } } }, error: null });
    const app = express();
    app.use(router);
    const res = await request(app).get('/produits').set('Authorization', 'Bearer tok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(data);
    expect(getUserMock).toHaveBeenCalledWith('tok');
    expect(fromMock).toHaveBeenCalledWith('v_produits_dernier_prix');
  });

  it('handles Supabase error for produits', async () => {
    rangeMock.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    const app = express();
    app.use(router);
    const res = await request(app).get('/produits?mama_id=m1').set('x-api-key', 'dev_key');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });

  it('fetches promotions with valid API key', async () => {
    const app = express();
    app.use(router);
    const res = await request(app).get('/promotions?mama_id=m1').set('x-api-key', 'dev_key');
    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith('promotions');
  });

  it('supports search and actif filters on promotions', async () => {
    const app = express();
    app.use(router);
    await request(app)
      .get('/promotions?mama_id=m1&search=summer&actif=true&page=2&limit=10')
      .set('x-api-key', 'dev_key');
    expect(chain.ilike).toHaveBeenCalledWith('nom', '%summer%');
    expect(chain.eq).toHaveBeenCalledWith('actif', true);
    expect(chain.range).toHaveBeenCalledWith(10, 19);
  });

  it('returns 401 when missing API key on stock', async () => {
    const app = express();
    app.use(router);
    const res = await request(app).get('/stock?mama_id=m1');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 with invalid API key on stock', async () => {
    const app = express();
    app.use(router);
    const res = await request(app)
      .get('/stock?mama_id=m1')
      .set('x-api-key', 'bad');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('fetches stock with valid API key', async () => {
    const app = express();
    app.use(router);
    const res = await request(app).get('/stock?mama_id=m1').set('x-api-key', 'dev_key');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(data);
    expect(fromMock).toHaveBeenCalledWith(TABLES.MOUVEMENTS);
  });

  it('applies since filter on stock', async () => {
    const app = express();
    app.use(router);
    await request(app).get('/stock?mama_id=m1&since=2024-01-01').set('x-api-key', 'dev_key');
    expect(chain.gte).toHaveBeenCalledWith('date', '2024-01-01');
  });

  it('supports type and pagination filters', async () => {
    const app = express();
    app.use(router);
    await request(app)
      .get('/stock?mama_id=m1&type=entree&page=2&limit=50&sortBy=type&order=asc')
      .set('x-api-key', 'dev_key');
    expect(chain.eq).toHaveBeenCalledWith('type', 'entree');
    expect(chain.order).toHaveBeenCalledWith('type', { ascending: true });
    expect(chain.range).toHaveBeenCalledWith(50, 99);
  });

  it('returns 400 when mama_id is missing on stock', async () => {
    const app = express();
    app.use(router);
    await request(app).get('/stock').set('x-api-key', 'dev_key').expect(400);
  });

  it('fetches stock with bearer token', async () => {
    getUserMock.mockResolvedValue({ data: { user: { user_metadata: { mama_id: 'm2' } } }, error: null });
    const app = express();
    app.use(router);
    const res = await request(app).get('/stock').set('Authorization', 'Bearer tok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(data);
    expect(getUserMock).toHaveBeenCalledWith('tok');
    expect(fromMock).toHaveBeenCalledWith(TABLES.MOUVEMENTS);
  });

  it('handles Supabase error for stock', async () => {
    rangeMock.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    const app = express();
    app.use(router);
    const res = await request(app).get('/stock?mama_id=m1').set('x-api-key', 'dev_key');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });

  it('works with generic env variables', async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    process.env.SUPABASE_URL = 'https://generic.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'gen';
    vi.resetModules();
    const altRouter = (await import('../src/api/public/index.js')).default;
    const app = express();
    app.use(altRouter);
    const res = await request(app).get('/produits?mama_id=m1').set('x-api-key', 'dev_key');
    expect(res.status).toBe(200);
    expect(createClientMock).toHaveBeenCalledWith('https://generic.supabase.co', 'gen');
    process.env.VITE_SUPABASE_URL = url;
    process.env.VITE_SUPABASE_ANON_KEY = key;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    vi.resetModules();
  });

  it('returns 500 when Supabase credentials are missing on produits', async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    vi.resetModules();
    const missingRouter = (await import('../src/api/public/index.js')).default;
    const app = express();
    app.use(missingRouter);
    const res = await request(app)
      .get('/produits?mama_id=m1')
      .set('x-api-key', 'dev_key');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Missing Supabase credentials' });
    process.env.VITE_SUPABASE_URL = url;
    process.env.VITE_SUPABASE_ANON_KEY = key;
    vi.resetModules();
  });

  it('returns 500 when Supabase credentials are missing on stock', async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    vi.resetModules();
    const missingRouter = (await import('../src/api/public/index.js')).default;
    const app = express();
    app.use(missingRouter);
    const res = await request(app)
      .get('/stock?mama_id=m1')
      .set('x-api-key', 'dev_key');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Missing Supabase credentials' });
    process.env.VITE_SUPABASE_URL = url;
    process.env.VITE_SUPABASE_ANON_KEY = key;
    vi.resetModules();
  });

  it('returns 401 with invalid bearer token', async () => {
    getUserMock.mockResolvedValueOnce({ data: null, error: new Error('bad') });
    const app = express();
    app.use(router);
    await request(app).get('/produits').set('Authorization', 'Bearer bad').expect(401);
    expect(getUserMock).toHaveBeenCalledWith('bad');
  });
});
