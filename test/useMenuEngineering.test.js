// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, test, expect } from 'vitest'

const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  order: vi.fn(() => query),
  maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'r1' }, error: null })),
  insert: vi.fn(() => query),
  update: vi.fn(() => query),
  then: fn => Promise.resolve(fn({ data: [{ id: 'f1' }], error: null }))
}
const fromMock = vi.fn(() => query)
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))
const authMock = vi.fn(() => ({ mama_id: 'm1' }))
vi.mock('@/context/AuthContext', () => ({ useAuth: authMock }))

let useMenuEngineering

beforeEach(async () => {
  ;({ useMenuEngineering } = await import('@/hooks/useMenuEngineering'))
  fromMock.mockClear()
  query.select.mockClear()
  query.eq.mockClear()
  query.order.mockClear()
  query.maybeSingle.mockClear()
  query.insert.mockClear()
  query.update.mockClear()
})

test('fetchData queries fiches and ventes', async () => {
  const { result } = renderHook(() => useMenuEngineering())
  await act(async () => {
    await result.current.fetchData()
  })
  expect(fromMock).toHaveBeenCalledWith('fiches')
  expect(query.select).toHaveBeenCalledWith('*')
  expect(query.eq).toHaveBeenCalledWith('mama_id', 'm1')
  expect(query.order).toHaveBeenCalledWith('nom')
  expect(fromMock).toHaveBeenCalledWith('ventes_fiches')
  expect(fromMock).toHaveBeenCalledWith('prix_vente')
})

test('fetchData skips when no mama_id', async () => {
  authMock.mockReturnValueOnce({ mama_id: null })
  ;({ useMenuEngineering } = await import('@/hooks/useMenuEngineering'))
  const { result } = renderHook(() => useMenuEngineering())
  await act(async () => {
    const data = await result.current.fetchData('2025-06-01')
    expect(data).toEqual([])
  })
  expect(fromMock).not.toHaveBeenCalled()
})
