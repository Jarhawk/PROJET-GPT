import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

const authMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: (...args) => authMock(...args),
}));

vi.mock('@/hooks/useMamaSettings', () => ({
  useMamaSettings: () => ({ loading: false, enabledModules: [] }),
}));

import Sidebar from '@/components/Sidebar.jsx';

describe('Sidebar paramétrage links', () => {
  beforeEach(() => {
    authMock.mockReset();
  });
  const originalDev = import.meta.env.DEV;
  afterEach(() => {
    import.meta.env.DEV = originalDev;
  });

  function setup({ userData }) {
    authMock.mockReturnValue({
      loading: false,
      userData,
      hasAccess: (key) => !!userData.access_rights[key],
    });
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
        <Routes>
          <Route path="/" element={<div />} />
          <Route path="/parametrage/familles" element={<div>Familles Page</div>} />
          <Route path="/parametrage/sous-familles" element={<div>SousFamilles Page</div>} />
          <Route path="/parametrage/unites" element={<div>Unites Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('affiche les liens quand rights.menus.parametrage est vrai', () => {
    import.meta.env.DEV = false;
    setup({
      userData: { role: 'user', access_rights: { menus: { parametrage: true } } },
    });
    expect(screen.getByText('Familles')).toBeInTheDocument();
    expect(screen.getByText('Sous-familles')).toBeInTheDocument();
    expect(screen.getByText('Unités')).toBeInTheDocument();
  });

  it('affiche les liens quand l\'utilisateur a un droit familles', () => {
    import.meta.env.DEV = false;
    setup({
      userData: { role: 'user', access_rights: { familles: true } },
    });
    expect(screen.getByText('Paramétrage')).toBeInTheDocument();
    expect(screen.getByText('Familles')).toBeInTheDocument();
  });

  it('affiche les liens pour un admin sans droits explicites', () => {
    import.meta.env.DEV = false;
    setup({ userData: { role: 'admin', access_rights: {} } });
    expect(screen.getByText('Familles')).toBeInTheDocument();
    expect(screen.getByText('Sous-familles')).toBeInTheDocument();
    expect(screen.getByText('Unités')).toBeInTheDocument();
  });

  it("affiche la section quand aucun droit parametrage n'est défini", () => {
    import.meta.env.DEV = false;
    setup({ userData: { role: 'user', access_rights: {} } });
    expect(screen.getByText('Paramétrage')).toBeInTheDocument();
    expect(screen.getByText('Familles')).toBeInTheDocument();
  });

  it('masque la section quand tous les modules paramétrage sont refusés', () => {
    import.meta.env.DEV = false;
    setup({
      userData: {
        role: 'user',
        access_rights: { familles: false, sous_familles: false, unites: false },
      },
    });
    expect(screen.queryByText('Paramétrage')).toBeNull();
  });

  it('affiche la section en mode dev même si modules refusés', () => {
    import.meta.env.DEV = true;
    setup({
      userData: {
        role: 'user',
        access_rights: { familles: false, sous_familles: false, unites: false },
      },
    });
    expect(screen.getByText('Paramétrage')).toBeInTheDocument();
  });
});
