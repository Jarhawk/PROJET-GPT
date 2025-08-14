import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '@/pages/auth/Login.jsx';

let authMock;
vi.mock('@/hooks/useAuth', () => ({
  useAuth: (...args) => authMock(...args),
}));

var mockNavigate;
vi.mock('react-router-dom', async () => {
  mockNavigate = vi.fn();
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Login', () => {
  beforeEach(() => {
    authMock = vi.fn();
    mockNavigate.mockReset();
  });

  it('affiche le formulaire si loading=false et session=null', () => {
    authMock.mockReturnValue({
      session: null,
      loading: false,
      signInWithPassword: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Email/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeTruthy();
  });

  it('redirige si session devient non-nulle', async () => {
    authMock.mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      signInWithPassword: vi.fn(),
    });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
