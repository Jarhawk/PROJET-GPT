// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react'
import { vi, beforeEach, test, expect } from 'vitest'

const sample = [
  {
    id: '1',
    nom: 'Plat A',
    famille: 'F1',
    prix_vente: 10,
    cout_portion: 4,
    ventes: 3,
    popularite: 0.6,
    margeEuro: 6,
    marge: 60,
    ca: 30,
    classement: 'Star',
  },
]

vi.mock('@/hooks/useMenuEngineering', () => ({
  useMenuEngineering: () => ({
    fetchData: vi.fn().mockResolvedValue(sample),
    saveVente: vi.fn(),
  }),
}))
vi.mock('@/hooks/useAuth', () => ({ default: () => ({ mama_id: 'm1', roles: ['admin'], loading: false }) }))
vi.mock('@/components/engineering/EngineeringFilters', () => ({ default: () => <div /> }))
vi.mock('@/components/engineering/EngineeringChart', () => ({ default: () => <div /> }))
vi.mock('@/components/engineering/ImportVentesExcel', () => ({ default: () => <div /> }))
vi.mock('html2canvas', () => ({ default: vi.fn() }))
vi.mock('jspdf', () => ({ default: vi.fn(() => ({ addImage: vi.fn(), save: vi.fn() })) }))
vi.mock('xlsx', () => ({ utils: { json_to_sheet: vi.fn(), book_new: vi.fn(() => ({})), book_append_sheet: vi.fn() }, writeFile: vi.fn() }))

let MenuEngineering

beforeEach(async () => {
  MenuEngineering = (await import('@/pages/engineering/MenuEngineering.jsx')).default
})

test('affiche les données du tableau', async () => {
  render(<MenuEngineering />)
  expect(await screen.findByText('Plat A')).toBeInTheDocument()
  expect(screen.getByText('Star')).toBeInTheDocument()
  expect(screen.getByText('30.00')).toBeInTheDocument()
})
