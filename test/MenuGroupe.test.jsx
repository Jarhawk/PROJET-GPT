// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const menus = [
  { id: '1', nom: 'Menu A', cout_total: 10, marge: 20, statut: 'valide' },
  { id: '2', nom: 'Menu B', cout_total: 15, marge: 25, statut: 'brouillon' },
];

vi.mock('@/hooks/useMenusGroupes', () => ({
  default: () => ({ menus, fetchMenusGroupes: vi.fn() }),
}));

let MenuGroupe;

beforeEach(async () => {
  MenuGroupe = (await import('@/pages/menus/MenuGroupe.jsx')).default;
});

test('liste et filtre les menus groupes', () => {
  render(<MenuGroupe />);
  expect(screen.getByText('Menu A - 10.00€ - marge 20.00%')).toBeInTheDocument();
  expect(screen.getByText('Menu B - 15.00€ - marge 25.00%')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('filtre'), { target: { value: 'valide' } });
  expect(screen.getByText('Menu A - 10.00€ - marge 20.00%')).toBeInTheDocument();
  expect(screen.queryByText('Menu B - 15.00€ - marge 25.00%')).toBeNull();
  expect(screen.getByText('Créer une formule')).toBeInTheDocument();
});
