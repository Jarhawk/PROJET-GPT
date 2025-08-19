import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

const authMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: (...args) => authMock(...args),
}));

vi.mock('@/hooks/useMamaSettings', () => ({
  default: () => ({ loading: false, enabledModules: [] }),
}));

import Sidebar from '@/components/Sidebar.jsx';

describe('Sidebar paramétrage links', () => {
  beforeEach(() => {
    authMock.mockReset();
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

  it('affiche les liens quand le module parametrage est activé', async () => {
    setup({
      userData: { access_rights: { enabledModules: ['parametrage'], parametrage: true } },
    });
    expect(screen.getByText('Familles')).toBeInTheDocument();
    expect(screen.getByText('Sous-familles')).toBeInTheDocument();
    expect(screen.getByText('Unités')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Familles'));
    expect(screen.getByText('Familles Page')).toBeInTheDocument();
  });

  it('masque les liens quand le module parametrage est absent', () => {
    setup({ userData: { access_rights: {} } });
    expect(screen.queryByText('Familles')).toBeNull();
    expect(screen.queryByText('Sous-familles')).toBeNull();
    expect(screen.queryByText('Unités')).toBeNull();
  });
});
