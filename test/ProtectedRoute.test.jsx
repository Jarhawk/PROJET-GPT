import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

let authMock;
vi.mock('@/hooks/useAuth', () => ({
  useAuth: (...args) => authMock(...args),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authMock = vi.fn();
  });

  it('redirige vers /login si non authentifié', async () => {
    authMock.mockReturnValue({ session: null, userData: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/private" element={<ProtectedRoute><div>Secret</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('Login')).toBeTruthy();
  });

  it('rend les enfants si authentifié et droit OK', () => {
    authMock.mockReturnValue({
      session: { user: { id: '1' } },
      userData: { access_rights: { dashboard: { peut_voir: true } } },
      loading: false,
    });
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute accessKey="dashboard">
                <div>Secret</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Secret')).toBeTruthy();
  });

  it('403 si droit KO', async () => {
    authMock.mockReturnValue({
      session: { user: { id: '1' } },
      userData: { access_rights: { dashboard: { peut_voir: false } } },
      loading: false,
    });
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={
              <ProtectedRoute accessKey="dashboard">
                <div>Secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<div>Forbidden</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('Forbidden')).toBeTruthy();
  });
});
