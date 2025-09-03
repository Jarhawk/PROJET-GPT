import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, test } from 'vitest';
import { useFactures } from '@/hooks/useFactures.js';

const qc = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

test('flow factures: basic create and fetch', async () => {
  const supabase = globalThis.__SUPABASE_TEST_CLIENT__;
  supabase.from.mockClear();
  const { result } = renderHook(() => useFactures(), { wrapper });
  await act(async () => {
    await result.current.getFactures();
  });
  expect(Array.isArray(result.current.factures)).toBe(true);
  await act(async () => {
    await result.current.createFacture({ numero: 'F1', date_facture: '2024-01-01', fournisseur_id: 'f1', total_ttc: 10, statut: 'Brouillon' });
  });
  expect(supabase.from).toHaveBeenCalledWith('factures');
});
