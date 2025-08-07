// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('@/hooks/useMenusGroupes', () => ({
  default: () => ({
    createOrUpdateMenu: vi.fn(),
    calculateMenuStats: ({ prix_vente, fiches }) => {
      const total = fiches.reduce((s, f) => s + (f.cout || 0), 0);
      return {
        totalCost: total,
        marge: prix_vente - total,
        taux_food_cost: prix_vente ? (total / prix_vente) * 100 : 0,
      };
    },
    exportMenuPDF: vi.fn(),
    exportMenuExcel: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFiches', () => ({ useFiches: () => ({ fiches: [{ id: 'f1', nom: 'Salade', cout_unitaire: 8 }] }) }));

let MenuGroupeForm;

beforeEach(async () => {
  MenuGroupeForm = (await import('@/pages/menus/MenuGroupeForm.jsx')).default;
});

test("ajout de fiche et alerte marge", () => {
  render(<MenuGroupeForm />);
  fireEvent.change(screen.getByLabelText('prix'), { target: { value: '10' } });
  fireEvent.click(screen.getByText('Ajouter fiche'));
  expect(screen.getByText('Coût total: 8.00 €')).toBeInTheDocument();
  expect(screen.getByText('Marge: 2.00 €')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
