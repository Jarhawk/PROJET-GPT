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
    {
      fiche_id: 1,
      nom: 'Test',
      type: 'plat',
      cout_par_portion: 5,
      prix_vente: 20,
      marge_euro: 15,
      marge_pct: 75,
      food_cost_pct: 25,
      actif: true,
    },
  ]
  const orderMock = vi.fn(() => Promise.resolve({ data: sample, error: null }))
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: orderMock,
  }
  fromSpy = vi.spyOn(supabase, 'from').mockReturnValue(query)
})

afterEach(() => {
  fromSpy.mockRestore()
})

test('fetchCosting returns rows from view', async () => {
  const { result } = renderHook(() => useCostingCarte(), { wrapper })
  await act(async () => {
    await result.current.fetchCosting()
  })
  expect(fromSpy).toHaveBeenCalledWith('v_costing_carte')
  expect(result.current.data[0]).toMatchObject({ marge_euro: 15, food_cost_pct: 25 })
})
