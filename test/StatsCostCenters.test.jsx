import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

let fetchStatsMock;
vi.mock('@/hooks/useCostCenterStats', () => ({
  useCostCenterStats: () => ({ fetchStats: fetchStatsMock })
}));

import StatsCostCenters from '@/pages/stats/StatsCostCenters.jsx';

test('filters by date range', async () => {
  fetchStatsMock = vi.fn().mockResolvedValue([]);
  render(<StatsCostCenters />);
  const startInput = await screen.findByLabelText('Date début');
  const endInput = screen.getByLabelText('Date fin');
  fireEvent.change(startInput, { target: { value: '2024-01-01' } });
  fireEvent.change(endInput, { target: { value: '2024-02-01' } });
  const button = screen.getByText('Filtrer');
  fireEvent.click(button);
  await screen.findByText('Ventilation par Cost Center');
  expect(fetchStatsMock).toHaveBeenLastCalledWith({
    debut: '2024-01-01',
    fin: '2024-02-01',
  });
});
