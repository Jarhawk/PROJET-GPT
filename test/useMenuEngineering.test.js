// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, test, expect } from 'vitest'

const sampleRows = [
  { id: 'f1', prix_vente: 10, cout_portion: 4, ventes: 10, popularite: 0.5 },
  { id: 'f2', prix_vente: 8, cout_portion: 5, ventes: 2, popularite: 0.1 },
]

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  order: vi.fn(() => query),
  maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'r1' }, error: null })),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  then: fn => Promise.resolve(fn({ data: sampleRows, error: null })),
}
const fromMock = vi.fn(() => query)
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))
const authMock = vi.fn(() => ({ mama_id: 'm1' }))
vi.mock('@/hooks/useAuth', () => ({ default: authMock }))

let useMenuEngineering

beforeEach(async () => {
  ({ useMenuEngineering } = await import('@/hooks/useMenuEngineering'))
  fromMock.mockClear()
  query.select.mockClear()
  query.eq.mockClear()
  query.order.mockClear()
  query.maybeSingle.mockClear()
  query.insert.mockClear()
  query.update.mockClear()
})

test('fetchData queries analytic view', async () => {
  const { result } = renderHook(() => useMenuEngineering())
  await act(async () => {
    await result.current.fetchData('2025-06-01')
  })
  expect(fromMock).toHaveBeenCalledWith('v_menu_engineering')
  expect(query.select).toHaveBeenCalledWith('*')
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1')
  expect(query.eq).toHaveBeenCalledWith('periode', '2025-06-01')
  expect(query.order).toHaveBeenCalledWith('nom')
})

test('fetchData computes ca and classement', async () => {
  const { result } = renderHook(() => useMenuEngineering())
  let rows
  await act(async () => {
    rows = await result.current.fetchData('2025-06-01')
  })
  expect(rows[0].ca).toBe(100)
  expect(rows[0].margeEuro).toBe(6)
  expect(rows[0].classement).toBe('Star')
  expect(rows[1].classement).toBe('Dog')
})

test('fetchData skips when no mama_id', async () => {
  authMock.mockReturnValueOnce({ mama_id: null });
  ({ useMenuEngineering } = await import('@/hooks/useMenuEngineering'))
  const { result } = renderHook(() => useMenuEngineering())
  await act(async () => {
    const data = await result.current.fetchData('2025-06-01')
    expect(data).toEqual([])
  })
  expect(fromMock).not.toHaveBeenCalled()
})
