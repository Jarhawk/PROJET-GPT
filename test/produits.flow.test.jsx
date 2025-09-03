// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, test, expect } from 'vitest';

vi.mock('@/lib/supabase', () => {
  const db = [];
  function buildSelect() {
    return {
      filters: {},
      eq(field, value) {
        this.filters[field] = value;
        return this;
      },
      order() {
        return this;
      },
      range() {
        const data = db.filter((r) => {
          if (this.filters.mama_id && r.mama_id !== this.filters.mama_id) return false;
          if (this.filters.actif !== undefined && r.actif !== this.filters.actif) return false;
          return true;
        });
        return Promise.resolve({ data, count: data.length, error: null });
      },
    };
  }
  const supabaseStub = {
    from(table) {
      if (table === 'produits') {
        return {
          select: buildSelect,
          insert: async (rows) => {
            db.push(...rows);
            return { data: rows, error: null };
          },
          update: (patch) => ({
            eq(field, value) {
              return {
                eq(field2, value2) {
                  for (const row of db) {
                    if (row[field] === value && row[field2] === value2) {
                      Object.assign(row, patch);
                    }
                  }
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
          }),
        };
      }
      return {
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      };
    },
  };
  return { supabase: supabaseStub };
});

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

import { useProducts } from '@/hooks/useProducts.js';

test('crée, modifie puis supprime un produit', async () => {
  const qc = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useProducts(), { wrapper });

  await act(async () => {
    await result.current.addProduct({ id: 'p1', nom: 'P1', actif: true }, { refresh: false });
  });
  await act(async () => {
    await result.current.fetchProducts();
  });
  expect(result.current.products).toEqual([
    { id: 'p1', nom: 'P1', actif: true, mama_id: 'm1', tva: 0, fournisseur_id: null },
  ]);

  await act(async () => {
    await result.current.updateProduct('p1', { nom: 'P1bis' }, { refresh: false });
  });
  await act(async () => {
    await result.current.fetchProducts();
  });
  expect(result.current.products[0].nom).toBe('P1bis');

  await act(async () => {
    await result.current.deleteProduct('p1', { refresh: false });
  });
  await act(async () => {
    await result.current.fetchProducts({ actif: true });
  });
  expect(result.current.products).toEqual([]);
});

