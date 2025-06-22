import { MamaStockSDK } from './index';

export async function getProduits(sdk: MamaStockSDK) {
  return sdk.fetchData('/api/public/v1/produits');
}
