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

vi.mock('@/lib/supabase', () => ({
  default: { from: fromMock },
  supabase: { from: fromMock },
}));
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
  await fetchAlerts('rupture');
  expect(fromMock).toHaveBeenCalledWith('v_alertes_rupture_api');
  expect(queryBuilder.select).toHaveBeenCalledWith(
    'id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, consommation_prevue, receptions, stock_projete, manque, type'
  );
  expect(queryBuilder.eq).toHaveBeenCalledTimes(1);
  expect(queryBuilder.eq).toHaveBeenCalledWith('type', 'rupture');
});

test('fetchAlerts falls back when stock_projete missing', async () => {
  queryBuilder.then
    .mockImplementationOnce((resolve) =>
      resolve({ data: null, error: { code: '42703' } })
    )
    .mockImplementationOnce((resolve) =>
      resolve({
        data: [
          {
            produit_id: 1,
            nom: 'p',
            stock_actuel: 5,
            consommation_prevue: 3,
            receptions: 2,
          },
        ],
        error: null,
      })
    );

  const { fetchAlerts } = useRuptureAlerts();
  const data = await fetchAlerts();
  expect(queryBuilder.select).toHaveBeenNthCalledWith(
    1,
    'id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, consommation_prevue, receptions, stock_projete, manque, type'
  );
  expect(queryBuilder.select).toHaveBeenNthCalledWith(
    2,
    'id:produit_id, produit_id, nom, unite, fournisseur_nom, stock_actuel, stock_min, consommation_prevue, receptions, manque, type'
  );
  expect(data[0].stock_projete).toBe(4);
});
