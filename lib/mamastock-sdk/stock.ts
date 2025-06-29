// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { MamaStockSDK } from './index';

export interface StockOptions {
  mamaId?: string;
  since?: string;
}

export async function getStock(sdk: MamaStockSDK, options: StockOptions = {}) {
  const params: Record<string, string> = {};
  if (options.mamaId) params.mama_id = options.mamaId;
  if (options.since) params.since = options.since;
  return sdk.fetchData('/api/public/v1/stock', params);
}
