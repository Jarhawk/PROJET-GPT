import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import Layout from '@/layout/Layout.jsx';

// Mocks
const authMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: (...args) => authMock(...args),
}));

const notificationsMock = {
  fetchUnreadCount: vi.fn(),
  subscribeToNotifications: vi.fn(),
};
vi.mock('@/hooks/useNotifications', () => ({
  default: () => notificationsMock,
}));

vi.mock('@/lib/supabase', () => ({ supabase: {} }));
vi.mock('@/layout/Sidebar', () => ({ default: () => <div>Sidebar</div> }));
vi.mock('@/components/Footer', () => ({ default: () => <div>Footer</div> }));
vi.mock('@/components/stock/AlertBadge', () => ({ default: () => <div /> }));
vi.mock('@/components/ui/PageSkeleton', () => ({ default: () => <div data-testid="skeleton">Loading</div> }));
vi.mock('@/components/LiquidBackground', () => ({
  LiquidBackground: () => <div />,
  WavesBackground: () => <div />,
  MouseLight: () => <div />,
  TouchLight: () => <div />,
}));

describe('Layout', () => {
  beforeEach(() => {
    authMock.mockReset();
    notificationsMock.fetchUnreadCount.mockReset();
    notificationsMock.subscribeToNotifications.mockReset();
  });

  it('affiche un skeleton pendant le chargement', () => {
    authMock.mockReturnValue({ session: null, userData: null, loading: true });
    notificationsMock.fetchUnreadCount.mockResolvedValue(0);
    notificationsMock.subscribeToNotifications.mockReturnValue(() => {});
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('skeleton')).toBeTruthy();
  });

  it('rend la mise en page après chargement du profil', () => {
    authMock.mockReturnValue({
      session: { user: { id: '1', email: 'test@example.com' } },
      userData: { nom: 'John', access_rights: {} },
      loading: false,
      logout: vi.fn(),
    });
    notificationsMock.fetchUnreadCount.mockResolvedValue(0);
    notificationsMock.subscribeToNotifications.mockReturnValue(() => {});

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Déconnexion')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
  });
});

afterAll(() => {
  vi.unmock('@/lib/supabase');
  vi.unmock('@/hooks/useNotifications');
});
