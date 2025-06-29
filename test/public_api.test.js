// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

process.env.PUBLIC_API_KEY = 'dev_key';
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'key';

const data = [{ id: 'p1' }];

const chain = {
  eq: vi.fn(() => chain),
  gte: vi.fn(() => chain),
  order: vi.fn(() => chain),
  limit: vi.fn(() => Promise.resolve({ data, error: null })),
};
const selectMock = vi.fn(() => chain);
const fromMock = vi.fn(() => ({ select: selectMock }));
const getUserMock = vi.fn();
const limitMock = chain.limit;

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: fromMock,
    auth: { getUser: getUserMock },
  })),
}));

let router;

beforeEach(async () => {
  router = (await import('../src/api/public/index.js')).default;
  fromMock.mockClear();
  selectMock.mockClear();
  chain.eq.mockClear();
  chain.gte.mockClear();
  chain.order.mockClear();
  chain.limit.mockClear();
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
    expect(fromMock).toHaveBeenCalledWith('produits');
  });

  it('applies famille filter when provided', async () => {
    const app = express();
    app.use(router);
    await request(app).get('/produits?mama_id=m1&famille=bio').set('x-api-key', 'dev_key');
    expect(chain.eq).toHaveBeenCalledWith('famille', 'bio');
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
    expect(fromMock).toHaveBeenCalledWith('produits');
  });

  it('handles Supabase error for produits', async () => {
    limitMock.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    const app = express();
    app.use(router);
    const res = await request(app).get('/produits?mama_id=m1').set('x-api-key', 'dev_key');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
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
    expect(fromMock).toHaveBeenCalledWith('mouvements_stock');
  });

  it('applies since filter on stock', async () => {
    const app = express();
    app.use(router);
    await request(app).get('/stock?mama_id=m1&since=2024-01-01').set('x-api-key', 'dev_key');
    expect(chain.gte).toHaveBeenCalledWith('date', '2024-01-01');
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
    expect(fromMock).toHaveBeenCalledWith('mouvements_stock');
  });

  it('handles Supabase error for stock', async () => {
    limitMock.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    const app = express();
    app.use(router);
    const res = await request(app).get('/stock?mama_id=m1').set('x-api-key', 'dev_key');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
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
