import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MouvementsAVentiler from '../src/pages/mouvements/MouvementsAVentiler.jsx';

vi.mock('../src/hooks/useUnallocatedMovements', () => ({
  useUnallocatedMovements: () => ({
    fetchUnallocated: vi.fn().mockResolvedValue([{ id: '1', product_id: 'p1', quantite: -2, created_at: '2024-01-01' }])
  })
}));

vi.mock('../src/components/analytics/CostCenterAllocationModal', () => ({
  __esModule: true,
  default: () => <div data-testid="modal" />
}));

describe('MouvementsAVentiler', () => {
  it.skip('renders rows and opens modal', async () => {
    await act(async () => {
      render(<MouvementsAVentiler />);
    });
    expect(await screen.findByText('p1')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText('Ventiler'));
    });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });
});
