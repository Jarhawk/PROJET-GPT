// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, fireEvent } from '@testing-library/react';
import { vi, test, expect } from 'vitest';

let currentProduct;

vi.mock('@/components/factures/ProduitSearchModal', () => ({
  __esModule: true,
  default: ({ onSelect }) => (
    <button onClick={() => onSelect(currentProduct)}>pick</button>
  ),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [{ id: 'z1', nom: 'Zone 1' }] }),
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ mama_id: 'm1' }) }));
vi.mock('@/lib/supabaseClient', () => ({}));

import FactureLigne from '@/components/FactureLigne';

test('sets zone_id from product zone_stock_id when selecting product', () => {
  currentProduct = { id: 'p1', nom: 'Prod', unite_id: 'u1', tva: 5.5, zone_id: 'zProd' };
  const onChange = vi.fn();
  const { getByText } = render(<FactureLigne value={{}} onChange={onChange} />);
  fireEvent.click(getByText('pick'));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ zone_id: 'zProd' })
  );
});

test('falls back to mama sole zone when product has no zone', () => {
  currentProduct = { id: 'p2', nom: 'Prod2', unite_id: 'u1', tva: 5.5, zone_id: null };
  const onChange = vi.fn();
  const { getByText } = render(<FactureLigne value={{}} onChange={onChange} />);
  fireEvent.click(getByText('pick'));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ zone_id: 'z1' })
  );
});
