import { vi } from 'vitest';

const queryBuilder = () => {
  const qb = {
    select: vi.fn(() => qb),
    eq: vi.fn(() => qb),
    neq: vi.fn(() => qb),
    ilike: vi.fn(() => qb),
    order: vi.fn(() => qb),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    limit: vi.fn(() => qb),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return qb;
};

export const supabase = {
  from: vi.fn(() => queryBuilder()),
  rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  auth: {
    getSession: vi.fn(() => ({
      data: {
        session: { access_token: 'token' },
      },
    })),
    signOut: vi.fn(),
  },
};
