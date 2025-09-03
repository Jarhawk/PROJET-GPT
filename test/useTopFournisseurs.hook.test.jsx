// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const limitMock = vi.fn(() =>
  Promise.resolve({
    data: [
      {
        fournisseur_id: 'f1',
        fournisseur: 'F1',
        montant: 100,
        nombre_achats: 2,
        mama_id: 'm1',
      },
    ],
    error: null,
  })
);
const orderMock = vi.fn(() => ({ limit: limitMock }));
const eqMock = vi.fn(() => ({ order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));

const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useTopFournisseurs;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ default: useTopFournisseurs } = await import(
    '@/hooks/gadgets/useTopFournisseurs.js'
  ));
});

test('récupère les top fournisseurs', async () => {
  const qc = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useTopFournisseurs('m1', { limit: 5 }), {
    wrapper,
  });
  await waitFor(() => {
    expect(result.current.data).toEqual([
      {
        fournisseur_id: 'f1',
        fournisseur: 'F1',
        montant: 100,
        nombre_achats: 2,
        mama_id: 'm1',
      },
    ]);
  });
  expect(fromMock).toHaveBeenCalledWith('v_top_fournisseurs');
  expect(selectMock).toHaveBeenCalledWith(
    'fournisseur_id, fournisseur, montant:montant_total, nombre_achats, mama_id'
  );
  expect(eqMock).toHaveBeenCalledWith('mama_id', 'm1');
  expect(orderMock).toHaveBeenCalledWith('montant_total', { ascending: false });
  expect(limitMock).toHaveBeenCalledWith(5);
});
