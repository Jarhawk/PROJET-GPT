// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { MamaStockSDK } from './index';

export interface StockOptions {
  mamaId?: string;
  since?: string;
  type?: string;
  zone?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export async function getStock(
  sdk: MamaStockSDK,
  options: StockOptions = {},
  signal?: AbortSignal,
) {
  const params: Record<string, string> = {};
  const mamaId = options.mamaId ?? sdk.mamaId;
  if (mamaId) params.mama_id = mamaId;
  if (options.since) params.since = options.since;
  if (options.type) params.type = options.type;
  if (options.zone) params.zone = options.zone;
  if (Number.isFinite(options.page)) params.page = String(options.page);
  if (Number.isFinite(options.limit)) params.limit = String(options.limit);
  if (options.sortBy) params.sortBy = options.sortBy;
  if (options.order) params.order = options.order;
  return sdk.fetchData('/api/public/v1/stock', params, undefined, undefined, undefined, signal);
}
