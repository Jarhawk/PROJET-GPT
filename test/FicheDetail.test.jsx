// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { render, screen } from '@testing-library/react';
import { vi, test } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({ default: () => ({ access_rights: { fiches_techniques: { peut_voir: true } }, loading: false }) }));
let getFicheByIdMock;
vi.mock('@/hooks/useFiches', () => ({ useFiches: () => ({ getFicheById: getFicheByIdMock }) }));
vi.mock('@/hooks/useFicheCoutHistory', () => ({ useFicheCoutHistory: () => ({ history: [], fetchFicheCoutHistory: vi.fn() }) }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));
vi.mock('xlsx', () => ({ utils: { book_new: vi.fn(), book_append_sheet: vi.fn(), json_to_sheet: vi.fn() }, writeFile: vi.fn() }), { virtual: true });
vi.mock('jspdf', () => ({ default: vi.fn(() => ({ text: vi.fn(), autoTable: vi.fn(), save: vi.fn(), lastAutoTable: { finalY: 0 } })) }));
vi.mock('jspdf-autotable', () => ({}), { virtual: true });

import FicheDetail from '@/pages/fiches/FicheDetail.jsx';

test('renders cost per portion and lines', () => {
  const fiche = {
    id: '1',
    nom: 'Fiche',
    portions: 2,
    cout_total: 6,
    cout_par_portion: 3,
    lignes: [{ produit_nom: 'Prod', quantite: 2, unite_nom: 'kg', produit_id: 'p1', pmp: 3 }],
  };
  getFicheByIdMock = vi.fn(() => Promise.resolve(fiche));
  render(
    <MemoryRouter>
      <FicheDetail fiche={fiche} onClose={vi.fn()} />
    </MemoryRouter>
  );
  const portion = screen.getByText(/Coût\/portion/).parentElement;
  expect(portion).toHaveTextContent('3.00 €');
  expect(screen.getByText(/Prod/)).toBeInTheDocument();
});
