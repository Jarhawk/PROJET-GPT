// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, test, expect } from 'vitest';

const menuData = {
  entrée: { fiche_id: 'f1', nom: 'Salade', cout_unitaire: 2, portions: 1 },
  plat: { fiche_id: 'f2', nom: 'Poulet', cout_unitaire: 3, portions: 1 },
  dessert: { fiche_id: 'f3', nom: 'Gateau', cout_unitaire: 1, portions: 1 },
};

vi.mock('@/hooks/useMenuDuJour', () => ({
  useMenuDuJour: () => ({
    fetchMenuForDate: vi.fn().mockResolvedValue(menuData),
    setFicheForCategorie: vi.fn(),
    setPortions: vi.fn(),
    removeFicheFromMenu: vi.fn(),
    reloadSavedFiches: vi.fn(),
    duplicateMenu: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFiches', () => ({ useFiches: () => ({ fiches: [], fetchFiches: vi.fn() }) }));
vi.mock('xlsx', () => ({ utils: { book_new: vi.fn(() => ({})), json_to_sheet: vi.fn(), book_append_sheet: vi.fn() }, writeFile: vi.fn() }));

let MenuDuJour;

beforeEach(async () => {
  MenuDuJour = (await import('@/pages/cuisine/MenuDuJour.jsx')).default;
});

test('affiche le coût global et l\'alerte', async () => {
  render(<MenuDuJour />);
  expect(await screen.findByText('Total global: 6.00 €')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
