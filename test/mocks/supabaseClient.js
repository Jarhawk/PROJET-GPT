import { vi } from 'vitest';

export function makeSupabaseMock({ data = [], error = null, count = 0 } = {}) {
  function createQuery() {
    const result = { data, error, count };
    const promise = Promise.resolve(result);
    const builder = {
      select: vi.fn(function () { return this; }),
      eq: vi.fn(function () { return this; }),
      ilike: vi.fn(function () { return this; }),
      order: vi.fn(function () { return this; }),
      range: vi.fn(function () { return this; }),
      limit: vi.fn(function () { return this; }),
      insert: vi.fn(function () { return this; }),
      update: vi.fn(function () { return this; }),
      upsert: vi.fn(function () { return this; }),
      delete: vi.fn(function () { return this; }),
      then: (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected),
      catch: (onRejected) => promise.catch(onRejected),
      finally: (onFinally) => promise.finally(onFinally)
    };
    return builder;
  }

  const from = vi.fn(() => createQuery());
  const rpc = vi.fn(() => Promise.resolve({ data, error, count }));
  const auth = {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(async () => ({ data: { session: null }, error: null }))
  };
  return { from, rpc, auth };
}
