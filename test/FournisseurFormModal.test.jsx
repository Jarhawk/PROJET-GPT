import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

const create = vi.fn();
vi.mock('@/hooks/useFournisseurs', () => ({
  useFournisseurs: () => ({
    createFournisseur: create,
    updateFournisseur: vi.fn(),
  }),
}));

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: vi.fn(), success: vi.fn() },
}));
import FournisseurFormModal from '@/components/fournisseurs/FournisseurFormModal.jsx';

it('validates email before submit', async () => {
  render(<FournisseurFormModal />);
  const emailInput = screen.getAllByRole('textbox')[2];
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Nom', name: 'nom' } });
  fireEvent.change(emailInput, {
    target: { name: 'email', value: 'oops' },
  });
  fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
  await waitFor(() => {
    expect(create).not.toHaveBeenCalled();
  });
});
