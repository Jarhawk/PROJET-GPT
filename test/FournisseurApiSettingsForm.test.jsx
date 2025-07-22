// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, test, beforeEach, expect } from 'vitest';

const maybeSingleMock = vi.fn(() => Promise.resolve({ data: null }));
const eqMock = vi.fn(function () {
  return { eq: eqMock, maybeSingle: maybeSingleMock };
});
const selectMock = vi.fn(() => ({ eq: eqMock, maybeSingle: maybeSingleMock }));
const singleMock = vi.fn(() => Promise.resolve({ data: {}, error: null }));
const selectAfterUpsert = vi.fn(() => ({ single: singleMock }));
const upsertMock = vi.fn(() => ({ select: selectAfterUpsert }));
const fromMock = vi.fn(() => ({ select: selectMock, upsert: upsertMock }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }));
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }));

let FournisseurApiSettingsForm;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ default: FournisseurApiSettingsForm } = await import('@/pages/fournisseurs/FournisseurApiSettingsForm.jsx'));
});

test('submits config with composite conflict keys', async () => {
  render(<FournisseurApiSettingsForm fournisseur_id="f1" />);
  const btn = await screen.findByRole('button', { name: /Enregistrer/i });
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'http://api' } });
  await fireEvent.click(btn);
  expect(fromMock).toHaveBeenCalledWith('fournisseurs_api_config');
  expect(fromMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  await waitFor(() => {
    expect(upsertMock).toHaveBeenCalledWith(
      [
        {
          actif: true,
          format_facture: 'json',
          type_api: 'rest',
          token: '',
          url: 'http://api',
          fournisseur_id: 'f1',
          mama_id: 'm1',
        },
      ],
      { onConflict: ['fournisseur_id', 'mama_id'] }
    );
  });
});
