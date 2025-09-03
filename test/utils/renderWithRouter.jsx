import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthProvider from '../../src/contexts/AuthContext.jsx';

export function renderWithRouter(ui, { route = '/', historyEntries = [route] } = {}) {
  return render(
    <MemoryRouter initialEntries={historyEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}
