// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { MamaStockSDK } from './index';

export interface ProduitsOptions {
  mamaId?: string;
  famille?: string;
}

export async function getProduits(sdk: MamaStockSDK, options: ProduitsOptions = {}) {
  const params: Record<string, string> = {};
  const mamaId = options.mamaId ?? sdk.mamaId;
  if (mamaId) params.mama_id = mamaId;
  if (options.famille) params.famille = options.famille;
  return sdk.fetchData('/api/public/v1/produits', params);
}
