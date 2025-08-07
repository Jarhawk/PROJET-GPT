// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi, test, expect } from 'vitest'

vi.mock('@/hooks/useAuth', () => ({ default: () => ({ role: 'manager', loading: false }) }))
vi.mock('@/hooks/useCostingCarte', () => ({
  useCostingCarte: () => ({
    fiches: [
      { id: 1, nom: 'Plat', type: 'plat', famille: 'A', prix_vente: 10, cout_unitaire: 3, marge_brute: 7, taux_food_cost: 30 },
      { id: 2, nom: 'Vin', type: 'boisson', famille: 'B', prix_vente: 5, cout_unitaire: 3, marge_brute: 2, taux_food_cost: 60 }
    ],
    fetchFichesPourLaCarte: vi.fn(),
    loading: false,
    error: null
  })
}))

import CostingCarte from '@/pages/analyse/CostingCarte.jsx'

test('filters by type', () => {
  render(<CostingCarte />, { wrapper: MemoryRouter })
  fireEvent.change(screen.getByLabelText(/Type/i), { target: { value: 'plat' } })
  expect(screen.getByText('Plat', { selector: 'td' })).toBeInTheDocument()
  expect(screen.queryByText('Vin')).toBeNull()
})

test('high food cost highlighted', () => {
  render(<CostingCarte />, { wrapper: MemoryRouter })
  const row = screen.getByText('Vin').closest('tr')
  expect(row.className).toMatch(/text-red-600/)
})
