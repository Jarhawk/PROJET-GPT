# MamaStock SDK Usage

The lightweight SDK in `lib/mamastock-sdk` provides helpers for calling the public API from Node or the browser.

Instantiate `MamaStockSDK` with a base URL and authentication parameters. You can provide an API key, a bearer token or both. The SDK automatically adds the required `x-api-key` and `Authorization` headers.

```ts
import { MamaStockSDK, getProduits } from '../lib/mamastock-sdk';

const sdk = new MamaStockSDK({
  baseUrl: 'https://api.example.com',
  apiKey: 'public_key',
  bearer: 'supabase_jwt'
});

const produits = await getProduits(sdk, {
  mamaId: 'm1',
  famille: 'dessert'
});
```

When a `mamaId` is supplied, it is appended to the request URL so the API can filter results for that establishment.

The SDK documentation is kept in sync with the Express routes. If you update the API authentication method, update this document and the README accordingly.
