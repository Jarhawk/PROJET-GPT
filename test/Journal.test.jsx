import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Journal from '@/pages/Journal.jsx';

vi.mock('@/hooks/useLogs', () => ({
  useLogs: () => ({
    logs: [
      { id: '1', action: 'user delete', created_at: '2024-01-01', users: { email: 'a@a.com' } }
    ],
    fetchLogs: vi.fn(),
    exportLogsToExcel: vi.fn(),
  }),
}));

test('highlight delete actions', async () => {
  render(<Journal />);
  const row = await screen.findByText('user delete');
  expect(row.closest('tr')).toHaveClass('bg-red-50');
});
