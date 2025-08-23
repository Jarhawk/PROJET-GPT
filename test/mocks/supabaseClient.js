import { vi } from 'vitest';

export function makeSupabaseMock({ data = null, error = null, count = null } = {}) {
  const result = { data, error, count };

  const handlers = {};
  const then = (resolve) => Promise.resolve(resolve(result));

  const query = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return then;
        if (!handlers[prop]) handlers[prop] = vi.fn(() => query);
        return handlers[prop];
      },
    }
  );

  const from = vi.fn(() => query);
  const rpc = vi.fn(() => Promise.resolve(result));
  const auth = {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
  };

  return { from, rpc, auth };
}
