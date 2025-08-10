// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

let hook;
vi.mock('@/hooks/useFeedback', () => ({
  useFeedback: () => hook,
}));
vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ mama_id: '1', loading: false }),
}));

import Feedback from '@/pages/Feedback.jsx';

beforeAll(() => {
  window.matchMedia = window.matchMedia || function () {
    return { matches: false, addListener: () => {}, removeListener: () => {} };
  };
});

test('submits user feedback', async () => {
  const addFeedback = vi.fn(() => Promise.resolve({}));
  hook = {
    items: [],
    fetchFeedback: vi.fn(),
    addFeedback,
    loading: false,
    error: null,
  };
  await act(async () => {
    render(<Feedback />);
  });
  fireEvent.change(screen.getByPlaceholderText('Module concerné'), { target: { value: 'Dashboard' } });
  fireEvent.change(screen.getByPlaceholderText('Votre message'), { target: { value: 'Super' } });
  const select = screen.getByRole('combobox');
  fireEvent.change(select, { target: { value: 'faible' } });
  await act(async () => {
    fireEvent.click(screen.getByText('Envoyer'));
  });
  expect(addFeedback).toHaveBeenCalledWith({ module: 'Dashboard', message: 'Super', urgence: 'faible' });
});
