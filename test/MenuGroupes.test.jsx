// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';

const menus = [
  { id: '1', nom: 'Formule 1', statut: 'brouillon', actif: true, prix_vente_personne: 20, resume: { cout_par_personne: 10, marge_pct: 50 } },
];

vi.mock('@/hooks/useMenuGroupe', () => ({
  default: () => ({ menus, fetchMenusGroupes: vi.fn(), exportExcel: vi.fn(), archiver: vi.fn() }),
}));

let MenuGroupes;

beforeEach(async () => {
  MenuGroupes = (await import('@/pages/menus/MenuGroupes.jsx')).default;
});

test('liste les menus groupes', () => {
  render(
    <MemoryRouter>
      <MenuGroupes />
    </MemoryRouter>
  );
  expect(screen.getByText('Formule 1')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Excel'));
  expect(screen.getByText('Formule 1')).toBeInTheDocument();
});
