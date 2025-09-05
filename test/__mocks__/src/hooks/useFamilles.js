// AUTO-GENERATED MOCK. Do not edit manually.
export const __isMock = true;
export const fetchFamillesForValidation = vi.fn(async () => ({ data: [] }));
export const useFamilles = vi.fn(() => ({
  familles: [],
  fetchFamilles: vi.fn(),
  addFamille: vi.fn(),
  updateFamille: vi.fn(),
  deleteFamille: vi.fn(),
  batchDeleteFamilles: vi.fn(),
  loading: false,
}));
export default useFamilles;
