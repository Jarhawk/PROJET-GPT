// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const selectMock = vi.fn();
const selectEqIdMock = vi.fn();
const selectEqMamaMock = vi.fn();
const singleMock = vi.fn();
selectMock.mockReturnValue({ eq: selectEqIdMock });
selectEqIdMock.mockReturnValue({ eq: selectEqMamaMock });
selectEqMamaMock.mockReturnValue({ single: singleMock });

const cfgSelectMock = vi.fn();
const cfgEqMamaMock = vi.fn();
const cfgEqFidMock = vi.fn();
const cfgSingleMock = vi.fn();
cfgSelectMock.mockReturnValue({ eq: cfgEqMamaMock });
cfgEqMamaMock.mockReturnValue({ eq: cfgEqFidMock });
cfgEqFidMock.mockReturnValue({ single: cfgSingleMock });

const updateMock = vi.fn();
const updEqIdMock = vi.fn();
const updEqMamaMock = vi.fn();
updateMock.mockReturnValue({ eq: updEqIdMock });
updEqIdMock.mockReturnValue({ eq: updEqMamaMock });

const fromMock = vi.fn()
  .mockImplementationOnce(() => ({ select: selectMock }))
  .mockImplementationOnce(() => ({ select: cfgSelectMock }))
  .mockImplementationOnce(() => ({ update: updateMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve({}) })));

let useFournisseurAPI;

beforeEach(async () => {
  ({ useFournisseurAPI } = await import('@/hooks/useFournisseurAPI'));
  selectMock.mockClear();
  selectEqIdMock.mockClear();
  selectEqMamaMock.mockClear();
  singleMock.mockResolvedValue({ data: { fournisseur_id: 'f1' }, error: null });
  cfgSelectMock.mockClear();
  cfgEqMamaMock.mockClear();
  cfgEqFidMock.mockClear();
  cfgSingleMock.mockResolvedValue({ data: { url: 'http://api', token: 't' }, error: null });
  updateMock.mockClear();
  updEqIdMock.mockClear();
  updEqMamaMock.mockClear();
  fromMock.mockClear();
  fetch.mockClear();
});

test('envoyerCommande updates with mama_id filter', async () => {
  const { result } = renderHook(() => useFournisseurAPI());
  await act(async () => {
    await result.current.envoyerCommande('c1');
  });
  expect(updateMock).toHaveBeenCalledWith({ statut: 'envoyee' });
  expect(updEqIdMock).toHaveBeenCalledWith('id', 'c1');
  expect(updEqMamaMock).toHaveBeenCalledWith('mama_id', 'm1');
});
