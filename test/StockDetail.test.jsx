import { buildRotationData } from '@/components/stock/StockDetail.jsx';
import { expect, test } from 'vitest';

test('buildRotationData aggregates sorties by month', () => {
  const mvts = [
    { date: '2024-01-05', type: 'sortie', quantite: 2 },
    { date: '2024-01-10', type: 'sortie', quantite: 3 },
    { date: '2024-02-02', type: 'entree', quantite: 1 },
  ];
  expect(buildRotationData(mvts)).toEqual([{ mois: '2024-01', q: 5 }]);
});
