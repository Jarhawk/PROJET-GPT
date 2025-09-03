import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.jsx';
import '../src/i18n.js';

test('navigates to Products from Dashboard', async () => {
  render(<App />);
  await screen.findByText(/Dashboard/i);
  fireEvent.click(screen.getByRole('link', { name: /Products/i }));
  await waitFor(() => expect(screen.getByRole('link', { name: /Products/i })).toHaveClass('is-active'));
});
