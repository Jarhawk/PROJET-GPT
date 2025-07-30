// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { buildPriceData } from '@/components/produits/priceHelpers.js';
import { expect, test } from 'vitest';

test('buildPriceData regroupe les prix par fournisseur et date', () => {
  const hist = [
    { derniere_livraison: '2024-01-05', prix_achat: 2, fournisseur: { nom: 'A' } },
    { derniere_livraison: '2024-01-05', prix_achat: 3, fournisseur: { nom: 'B' } },
    { derniere_livraison: '2024-02-01', prix_achat: 4, fournisseur: { nom: 'A' } },
  ];
  expect(buildPriceData(hist)).toEqual([
    { date: '2024-01-05', A: 2, B: 3 },
    { date: '2024-02-01', A: 4, B: null },
  ]);
});
