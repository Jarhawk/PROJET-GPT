import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

let fetchTotalsMock;
vi.mock('@/hooks/useFournisseurTotals', () => ({
  useFournisseurTotals: () => ({ fetchTotals: fetchTotalsMock })
}));

import StatsFournisseurs from '@/pages/stats/StatsFournisseurs.jsx';

test('shows totals table', async () => {
  fetchTotalsMock = vi.fn().mockResolvedValue([
    { fournisseur_id: 'f1', nom: 'Foo', nb_factures: 2, total_achats: 100, last_invoice_date: '2024-01-01' }
  ]);
  render(<StatsFournisseurs />);
  await screen.findByText('Achats par fournisseur');
  expect(fetchTotalsMock).toHaveBeenCalled();
  expect(screen.getByText('Foo')).toBeInTheDocument();
});
