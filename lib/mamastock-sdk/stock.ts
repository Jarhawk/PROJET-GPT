import { MamaStockSDK } from './index';

export async function getStock(sdk: MamaStockSDK) {
  return sdk.fetchData('/api/public/v1/stock');
}
