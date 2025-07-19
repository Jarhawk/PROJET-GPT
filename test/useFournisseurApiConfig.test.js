// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const queryObj = {
  select: vi.fn(() => queryObj),
  eq: vi.fn(() => queryObj),
  order: vi.fn(() => queryObj),
  range: vi.fn(() => queryObj),
  maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'c1' }, error: null })),
  upsert: vi.fn(() => ({ select: () => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'c1' }, error: null })) }) })),
  delete: vi.fn(() => queryObj),
};

const fromMock = vi.fn(() => queryObj);
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

let useFournisseurApiConfig;

beforeEach(async () => {
  ({ useFournisseurApiConfig } = await import('@/hooks/useFournisseurApiConfig'));
  fromMock.mockClear();
  queryObj.select.mockClear();
  queryObj.eq.mockClear();
  queryObj.maybeSingle.mockClear();
  queryObj.upsert.mockClear();
  queryObj.delete.mockClear();
});

test('fetchConfig queries by composite key', async () => {
  const { result } = renderHook(() => useFournisseurApiConfig());
  await act(async () => { await result.current.fetchConfig('f1'); });
  expect(fromMock).toHaveBeenCalledWith('fournisseurs_api_config');
  expect(queryObj.select).toHaveBeenCalledWith('*');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('fournisseur_id', 'f1');
  expect(queryObj.maybeSingle).toHaveBeenCalled();
});

test('saveConfig upserts with composite key', async () => {
  const { result } = renderHook(() => useFournisseurApiConfig());
  await act(async () => { await result.current.saveConfig('f1', { actif: true }); });
  expect(queryObj.upsert).toHaveBeenCalledWith([
    { actif: true, fournisseur_id: 'f1', mama_id: 'm1' }],
    { onConflict: ['fournisseur_id', 'mama_id'] }
  );
});

test('deleteConfig filters by keys', async () => {
  const { result } = renderHook(() => useFournisseurApiConfig());
  await act(async () => { await result.current.deleteConfig('f1'); });
  expect(queryObj.delete).toHaveBeenCalled();
  expect(queryObj.eq).toHaveBeenCalledWith('fournisseur_id', 'f1');
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
});

test('listConfigs applies filters and pagination', async () => {
  const { result } = renderHook(() => useFournisseurApiConfig());
  await act(async () => {
    await result.current.listConfigs({ actif: true, page: 2, limit: 10 });
  });
  expect(fromMock).toHaveBeenCalledWith('fournisseurs_api_config');
  expect(queryObj.select).toHaveBeenCalledWith('*, fournisseur:fournisseurs(id, nom)', { count: 'exact' });
  expect(queryObj.eq).toHaveBeenCalledWith('mama_id', 'm1');
  expect(queryObj.eq).toHaveBeenCalledWith('actif', true);
  expect(queryObj.range).toHaveBeenCalledWith(10, 19);
});
