// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { vi, test } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({ default: () => ({ access_rights: { fiches_techniques: { peut_voir: true } }, loading: false }) }));
vi.mock('@/hooks/useFiches', () => ({ useFiches: () => ({ createFiche: vi.fn(), updateFiche: vi.fn() }) }));
vi.mock('@/hooks/useProducts', () => ({ useProducts: () => ({ products: [{ id: 'p1', nom: 'Prod', pmp: 3, unite: { nom: 'kg' } }], fetchProducts: vi.fn() }) }));
vi.mock('@/hooks/useFamilles', () => ({ useFamilles: () => ({ familles: [], fetchFamilles: vi.fn() }) }));
vi.mock('@/hooks/useFichesAutocomplete', () => ({ useFichesAutocomplete: () => ({ results: [], searchFiches: vi.fn() }) }));

import FicheForm from '@/pages/fiches/FicheForm.jsx';

test('calculates cost per portion', () => {
  const fiche = { portions: 2, lignes: [{ type: 'produit', produit_id: 'p1', quantite: 2 }] };
  render(<FicheForm fiche={fiche} onClose={vi.fn()} />);
  const total = screen.getByText(/Coût total/).parentElement;
  const portion = screen.getByText(/Coût\/portion/).parentElement;
  expect(total).toHaveTextContent('6.00 €');
  expect(portion).toHaveTextContent('3.00 €');
});
