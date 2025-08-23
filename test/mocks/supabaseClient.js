import { vi } from 'vitest';

export function makeSupabaseMock({ data = null, error = null, count = null } = {}) {
  const result = { data, error, count };

  const createBuilder = () => {
    const builder = {};
    const returnThis = () => builder;

    ['select', 'eq', 'ilike', 'order', 'range', 'limit', 'insert', 'update', 'upsert', 'delete', 'rpc']
      .forEach((method) => {
        builder[method] = vi.fn(returnThis);
      });

    const promise = Promise.resolve(result);
    builder.then = (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected);
    builder.catch = (onRejected) => promise.catch(onRejected);
    builder.finally = (onFinally) => promise.finally(onFinally);

    return builder;
  };

  return {
    from: vi.fn(() => createBuilder()),
    rpc: vi.fn(() => createBuilder()),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(),
    },
  };
}
