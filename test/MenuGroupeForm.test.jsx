// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('@/hooks/useMenuGroupe', () => ({
  default: () => ({
    createMenuGroupe: vi.fn().mockResolvedValue({ id: '1' }),
    addLigne: vi.fn().mockResolvedValue({}),
    exportPdf: vi.fn(),
    exportExcel: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFiches', () => ({ useFiches: () => ({ fiches: [{ id: 'f1', nom: 'Salade', cout_unitaire: 8 }] }) }));

let MenuGroupeForm;

beforeEach(async () => {
  MenuGroupeForm = (await import('@/pages/menus/MenuGroupeForm.jsx')).default;
});

test('ajout fiche calcule les couts', () => {
  render(<MenuGroupeForm />);
  fireEvent.change(screen.getByLabelText('prix'), { target: { value: '10' } });
  fireEvent.click(screen.getByText('Ajouter fiche'));
  expect(screen.getByText('Coût total: 8.00 €')).toBeInTheDocument();
  expect(screen.getByText(/Marge: 2.00 €/)).toBeInTheDocument();
});
