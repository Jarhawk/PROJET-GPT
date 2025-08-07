// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, test, expect } from 'vitest'
import { supabase } from '@/lib/supabase'
import { AuthContext } from '@/context/AuthContext'

vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1' }) }))

let useCostingCarte
let fromSpy

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ mama_id: 'm1' }}>{children}</AuthContext.Provider>
)

beforeEach(async () => {
  ;({ useCostingCarte } = await import('@/hooks/useCostingCarte'))
  const sample = [
    { id: 1, nom: 'Test', famille: 'A', sous_famille: null, type: 'plat', portions: 2, cout_total: 10, prix_vente: 20 }
  ]
  const orderMock = vi.fn(() => Promise.resolve({ data: sample, error: null }))
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    not: vi.fn(() => query),
    gt: vi.fn(() => query),
    order: orderMock,
  }
  fromSpy = vi.spyOn(supabase, 'from').mockReturnValue(query)
})

afterEach(() => { fromSpy.mockRestore() })

test('calculates margins and ratios', async () => {
  const { result } = renderHook(() => useCostingCarte(), { wrapper })
  await act(async () => { await result.current.fetchFichesPourLaCarte() })
  expect(result.current.fiches[0]).toMatchObject({
    cout_unitaire: 5,
    marge_brute: 15,
    taux_food_cost: 25,
  })
})
