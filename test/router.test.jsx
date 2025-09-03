import { render, screen } from '@testing-library/react';
import App from '../src/App.jsx';
import '../src/i18n.js';

test('root path redirects to dashboard', async () => {
  render(<App />);
  await screen.findByText(/Dashboard/i);
});
