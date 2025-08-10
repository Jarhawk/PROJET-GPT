// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

let hook;
vi.mock('@/hooks/useInvoiceImport', () => ({
  useInvoiceImport: () => hook,
}));
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ mama_id: '1', loading: false }),
}));

import ImportFactures from '@/pages/factures/ImportFactures.jsx';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };
});

test('uploads file and calls hook', async () => {
  const importFromFile = vi.fn(() => Promise.resolve('id'));
  hook = { importFromFile, loading: false, error: null };
  await act(async () => {
    render(<ImportFactures />);
  });
  const fileInput = document.querySelector('input[type="file"]');
  const file = new File(['{}'], 'facture.json', { type: 'application/json' });
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [file] } });
  });
  await act(async () => {
    fireEvent.click(screen.getByText('Importer'));
  });
  expect(importFromFile).toHaveBeenCalled();
});
