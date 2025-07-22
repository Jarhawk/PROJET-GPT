// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { vi } from 'vitest';

let hook;
vi.mock('@/hooks/useFournisseurApiConfig', () => ({
  useFournisseurApiConfig: () => hook,
}));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

import ApiFournisseurs from '@/pages/fournisseurs/ApiFournisseurs.jsx';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
});

test('shows list and edit link', async () => {
  hook = {
    listConfigs: vi.fn(() => Promise.resolve({ data: [{ fournisseur_id: 'f1', url: 'u', type_api: 'rest', actif: true, fournisseur: { nom: 'Test' } }], count: 1 })),
    loading: false,
    error: null,
  };
  render(
    <MemoryRouter>
      <ApiFournisseurs />
    </MemoryRouter>
  );
  await waitFor(() => expect(hook.listConfigs).toHaveBeenCalled());
  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Éditer/i })).toHaveAttribute('href', '/fournisseurs/f1/api');
});
