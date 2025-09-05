// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { parseProduitsFile, validateProduitRow } from '@/utils/importExcelProduits.js';

// Mock supabase to return reference data
const famillesData = [
  { id: 1, nom: 'Legumes' },
  { id: 2, nom: 'Fruits' },
];
const sousFamillesData = [
  { id: 10, nom: 'Rouge' },
  { id: 11, nom: 'Racine' },
];
const unitesData = [{ id: 100, nom: 'Kg' }];
const zonesData = [{ id: 200, nom: 'Reserve' }];

vi.mock('@/hooks/useFamilles', () => ({
  fetchFamillesForValidation: () => ({ data: famillesData }),
}));
vi.mock('@/hooks/useUnites', () => ({
  fetchUnitesForValidation: () => ({ data: unitesData }),
}));
vi.mock('@/hooks/useZonesStock', () => ({
  fetchZonesStock: () => ({ data: zonesData }),
}));

vi.mock('@/lib/supabase', () => {
  const resolve = (table) => {
    switch (table) {
      case 'familles':
        return { data: famillesData };
      case 'sous_familles':
        return { data: sousFamillesData };
      case 'unites':
        return { data: unitesData };
      case 'zones_stock':
        return { data: zonesData };
      case 'fournisseurs':
        return { data: [] };
      case 'produits':
        return { data: [] };
      default:
        return { data: [] };
    }
  };
  const supabaseMock = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve(resolve(table)),
          then: (cb) => cb(resolve(table)),
        }),
      }),
    }),
  };
  return { getSupabaseClient: () => supabaseMock, supabase: supabaseMock };
});

function buildFile(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Feuil1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return {
    arrayBuffer: async () => buf,
  };
}

describe('parseProduitsFile', () => {
  it('detects invalid rows and allows correction', async () => {
    const file = buildFile([
      { nom: 'Tomate', famille: 'Legumes', sous_famille: 'Rouge', unite: 'Kg', zone_stock: 'Reserve', stock_min: 5, actif: true },
      { nom: 'Carotte', famille: 'Legumes', sous_famille: 'Racine', unite: 'Kg', zone_stock: 'Reserve', stock_min: 2, actif: true },
      { nom: 'Pomme', famille: 'Fruits', sous_famille: '', unite: 'Kg', zone_stock: 'Reserve', stock_min: 1, actif: true },
      { nom: 'Mystery', famille: 'Invalide', sous_famille: '', unite: 'Kg', zone_stock: 'Reserve', stock_min: 0, actif: true },
    ]);
    const { rows, maps } = await parseProduitsFile(file, '1');
    expect(rows).toHaveLength(4);
    const statuses = rows.map((r) => r.status);
    expect(statuses.filter((s) => s === 'ok')).toHaveLength(3);
    expect(statuses.filter((s) => s === 'error')).toHaveLength(1);

    // Correct the invalid row
    const idx = statuses.indexOf('error');
    const corrected = validateProduitRow(
      { ...rows[idx], famille_nom: 'Legumes' },
      maps
    );
    expect(corrected.status).toBe('ok');
  });
});
