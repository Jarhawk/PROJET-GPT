import { vi } from 'vitest';

export function makeSupabaseMock(init = { data: [], error: null, count: 0 }) {
  const result = Promise.resolve({
    data: init.data,
    error: init.error,
    count: init.count
  });

  const chain = {
    from: vi.fn(() => chain),
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    order: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    or: vi.fn(() => chain),
    in: vi.fn(() => chain),
    range: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => result),
    maybeSingle: vi.fn(() => result),
    then: result.then.bind(result),
    catch: result.catch.bind(result),
    finally: result.finally?.bind(result) ?? ((f) => result)
  };
  return chain;
}
