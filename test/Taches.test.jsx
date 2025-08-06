import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Taches from '@/pages/taches/Taches.jsx';

let mockTachesHook;
let mockUsersHook;
vi.mock('@/hooks/useTaches', () => ({ useTaches: () => mockTachesHook }));
vi.mock('@/hooks/useUtilisateurs', () => ({ useUtilisateurs: () => mockUsersHook }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

it('affiche la liste des tâches', () => {
  mockTachesHook = {
    taches: [
      {
        id: '1',
        statut: 'a_faire',
        titre: 'Tâche test',
        priorite: 'haute',
        date_echeance: '2025-05-01',
        utilisateurs_taches: [{ utilisateur: { nom: 'Jean' } }],
    }],
    loading: false,
    error: null,
    fetchTaches: vi.fn(),
    createTache: vi.fn(),
  };
  mockUsersHook = { users: [], fetchUsers: vi.fn() };

  render(
    <MemoryRouter>
      <Taches />
    </MemoryRouter>
  );

  expect(screen.getByText('Tâche test')).toBeInTheDocument();
});
