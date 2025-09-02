// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const selectAfterInsert = vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'f1' }, error: null })) }));
const insertFournisseur = vi.fn(() => ({ select: selectAfterInsert }));
const insertContact = vi.fn(() => Promise.resolve({ data: {}, error: null }));
const upsertContact = vi.fn(() => Promise.resolve({ data: {}, error: null }));
const updateFournisseur = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) }));

const fetchQuery = {
  select: vi.fn(() => fetchQuery),
  eq: vi.fn(() => fetchQuery),
  in: vi.fn(() => fetchQuery),
  order: vi.fn(() => fetchQuery),
  range: vi.fn(() => fetchQuery),
  ilike: vi.fn(() => fetchQuery),
  then: (res) => Promise.resolve(res({ data: [], error: null, count: 0 })),
};

const fromMock = vi.fn((table) => {
  if (table === 'fournisseurs') {
    return { insert: insertFournisseur, update: updateFournisseur, select: fetchQuery.select, eq: fetchQuery.eq, order: fetchQuery.order, range: fetchQuery.range, ilike: fetchQuery.ilike };
  }
  if (table === 'fournisseur_contacts') {
    return { insert: insertContact, upsert: upsertContact, select: fetchQuery.select, eq: fetchQuery.eq, in: fetchQuery.in };
  }
  return fetchQuery;
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useFournisseurs;
let queryClient;

function wrapper({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(async () => {
  vi.clearAllMocks();
  queryClient = new QueryClient();
  ({ useFournisseurs } = await import('@/hooks/useFournisseurs'));
});

test('createFournisseur insère un contact lié', async () => {
  const { result } = renderHook(() => useFournisseurs(), { wrapper });
  await act(async () => {
    await result.current.createFournisseur({ nom: 'Test', tel: '1', email: 'a@b.com', contact: 'T' });
  });
  expect(fromMock).toHaveBeenCalledWith('fournisseurs');
  expect(insertFournisseur).toHaveBeenCalledWith([{ nom: 'Test', actif: true, mama_id: 'm1' }]);
  expect(fromMock).toHaveBeenCalledWith('fournisseur_contacts');
  expect(insertContact).toHaveBeenCalledWith({ fournisseur_id: 'f1', mama_id: 'm1', nom: 'T', email: 'a@b.com', tel: '1' });
});

test('updateFournisseur met à jour le contact', async () => {
  const { result } = renderHook(() => useFournisseurs(), { wrapper });
  await act(async () => {
    await result.current.updateFournisseur('f1', { actif: false, tel: '2', email: 'b@b.com', contact: 'B' });
  });
  expect(updateFournisseur).toHaveBeenCalledWith({ actif: false });
  expect(fromMock).toHaveBeenCalledWith('fournisseur_contacts');
  expect(upsertContact).toHaveBeenCalledWith([
    { fournisseur_id: 'f1', mama_id: 'm1', nom: 'B', email: 'b@b.com', tel: '2' }
  ], { onConflict: ['fournisseur_id', 'mama_id'] });
});
