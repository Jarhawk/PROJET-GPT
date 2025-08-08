// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { vi, test } from 'vitest';

vi.mock('@/hooks/useUtilisateurs', () => ({
  useUtilisateurs: () => ({
    users: [],
    loading: false,
    error: null,
    getUtilisateurs: vi.fn(),
    toggleUserActive: vi.fn(),
  }),
}));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', role: 'admin', loading: false }) }));
vi.mock('@/hooks/useRoles', () => ({ useRoles: () => ({ roles: [], fetchRoles: vi.fn() }) }));
vi.mock('@/components/Utilisateurs/UtilisateurRow', () => ({ default: () => <tr data-testid="row" /> }));
vi.mock('@/components/Utilisateurs/UtilisateurForm', () => ({ default: () => <div>form</div> }));

import Utilisateurs from '@/pages/parametrage/Utilisateurs.jsx';

test('renders add user button', () => {
  render(<Utilisateurs />);
  expect(screen.getByText('Ajouter un utilisateur')).toBeInTheDocument();
});
