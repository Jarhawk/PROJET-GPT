// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi, test, expect } from 'vitest'

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({
    role: 'manager',
    loading: false,
    access_rights: { costing_carte: { export: true } },
  }),
}))
vi.mock('@/hooks/useCostingCarte', () => ({
  useCostingCarte: () => ({
    data: [
      {
        fiche_id: 1,
        nom: 'Plat',
        type: 'plat',
        famille: 'A',
        actif: true,
        cout_par_portion: 3,
        prix_vente: 10,
        marge_euro: 7,
        marge_pct: 70,
        food_cost_pct: 30,
      },
      {
        fiche_id: 2,
        nom: 'Vin',
        type: 'boisson',
        famille: 'B',
        actif: true,
        cout_par_portion: 3,
        prix_vente: 5,
        marge_euro: 2,
        marge_pct: 40,
        food_cost_pct: 60,
      },
    ],
    settings: { objectif_marge_pct: 50, objectif_food_cost_pct: 40 },
    fetchCosting: vi.fn(),
    fetchSettings: vi.fn(),
    exportExcel: vi.fn(),
    exportPdf: vi.fn(),
    loading: false,
    error: null,
  }),
}))

import CostingCarte from '@/pages/costing/CostingCarte.jsx'

test('filters by type', () => {
  render(<CostingCarte />, { wrapper: MemoryRouter })
  fireEvent.change(screen.getByLabelText(/Type/i), {
    target: { value: 'plat' },
  })
  expect(screen.getByText('Plat', { selector: 'td' })).toBeInTheDocument()
  expect(screen.queryByText('Vin')).toBeNull()
})

test('high food cost shows badge', () => {
  render(<CostingCarte />, { wrapper: MemoryRouter })
  expect(screen.getAllByText('FC').length).toBeGreaterThan(0)
})
