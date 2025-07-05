// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { MamaStockSDK } from './index';

export interface ProduitsOptions {
  mamaId?: string;
  famille?: string;
  search?: string;
  actif?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export async function getProduits(
  sdk: MamaStockSDK,
  options: ProduitsOptions = {},
  signal?: AbortSignal,
) {
  const params: Record<string, string> = {};
  const mamaId = options.mamaId ?? sdk.mamaId;
  if (mamaId) params.mama_id = mamaId;
  if (options.famille) params.famille = options.famille;
  if (options.search) params.search = options.search;
  if (options.actif !== undefined) params.actif = String(options.actif);
  if (Number.isFinite(options.page)) params.page = String(options.page);
  if (Number.isFinite(options.limit)) params.limit = String(options.limit);
  if (options.sortBy) params.sortBy = options.sortBy;
  if (options.order) params.order = options.order;
  return sdk.fetchData('/api/public/v1/produits', params, undefined, undefined, undefined, signal);
}
