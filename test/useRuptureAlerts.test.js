// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { vi, test, expect, beforeEach } from 'vitest';
let useRuptureAlerts;

const queryBuilder = {
  select: vi.fn(() => queryBuilder),
  order: vi.fn(() => queryBuilder),
  eq: vi.fn(() => queryBuilder),
  then: vi.fn((resolve) => resolve({ data: [], error: null })),
};
const fromMock = vi.fn(() => queryBuilder);

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

beforeEach(async () => {
  ({ useRuptureAlerts } = await import('@/hooks/useRuptureAlerts'));
  fromMock.mockClear();
  queryBuilder.select.mockClear();
  queryBuilder.order.mockClear();
  queryBuilder.eq.mockClear();
  queryBuilder.then.mockClear();
  queryBuilder.then.mockImplementation((resolve) =>
    resolve({ data: [], error: null })
  );
});

test('fetchAlerts selects expected view columns', async () => {
  const { fetchAlerts } = useRuptureAlerts();
  await fetchAlerts();
  expect(fromMock).toHaveBeenCalledWith('v_alertes_rupture');
  expect(queryBuilder.select).toHaveBeenCalledWith(
    'produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, manque'
  );
  expect(queryBuilder.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryBuilder.order).toHaveBeenCalledWith('manque', { ascending: false });
});

test('fetchAlerts returns data', async () => {
  queryBuilder.then.mockImplementation((resolve) =>
    resolve({
      data: [
        {
          produit_id: 1,
          nom: 'p',
          unite: 'u',
          fournisseur_nom: 'f',
          stock_actuel: 5,
          stock_min: 10,
          manque: 5,
        },
      ],
      error: null,
    })
  );
  const { fetchAlerts } = useRuptureAlerts();
  const data = await fetchAlerts();
  expect(data[0].nom).toBe('p');
});
