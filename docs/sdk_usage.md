# MamaStock SDK Usage

The lightweight SDK in `lib/mamastock-sdk` provides helpers for calling the public API from Node or the browser.

Instantiate `MamaStockSDK` with a base URL and authentication parameters. If `baseUrl` is omitted the SDK reads `MAMASTOCK_BASE_URL` from the environment. It also reads `MAMASTOCK_API_KEY` and `MAMASTOCK_TOKEN` when the `apiKey` or `token` options are missing. You may also set `mamaId` (or define `MAMASTOCK_MAMA_ID`) to apply the establishment id to all requests. The SDK automatically adds the required `x-api-key` and `Authorization` headers.

```ts
import { MamaStockSDK, getProduits } from '../lib/mamastock-sdk';

const sdk = new MamaStockSDK({
  baseUrl: 'https://api.example.com',
  apiKey: 'public_key',
  token: 'supabase_jwt',
  mamaId: 'm1'
});

const produits = await getProduits(sdk, {
  // mamaId defaults to sdk.mamaId
  famille: 'dessert',
  search: 'choco',
  actif: true,
  page: 1,
  limit: 50,
  sortBy: 'nom',
});
```

The options mirror the public API parameters so you can search by name, filter on `famille` or `actif` and paginate results. When a `mamaId` is supplied (either per call or via the SDK constructor), it is appended to the request URL so the API can filter results for that establishment. You may provide a third `AbortSignal` argument to abort the request.

Use `getStock` to list movements with similar options:

```ts
import { getStock } from '../lib/mamastock-sdk';

const mouvements = await getStock(sdk, {
  since: '2024-01-01',
  type: 'entree',
  zone: 'frigo',
  page: 2,
  limit: 50,
  sortBy: 'date',
  order: 'desc',
});
```

`getStock` accepts `since`, `type`, `zone`, `page`, `limit`, `sortBy` and `order` to mirror the Express route. A third `AbortSignal` argument lets you cancel the request.

Use `getPromotions` to retrieve active promotions with search and pagination:

```ts
import { getPromotions } from '../lib/mamastock-sdk';

const promos = await getPromotions(sdk, {
  search: 'spring',
  actif: true,
  page: 1,
  limit: 20,
  sortBy: 'date_debut',
  order: 'desc',
});
```

`getPromotions` accepts `search`, `actif`, `page`, `limit`, `sortBy` and `order` parameters just like the route. You may pass a third `AbortSignal` argument to cancel the request.

`fetchData` automatically retries when the API responds with HTTP 429 or 503.
You can control the maximum number of attempts via the `retryAttempts` option
passed to `MamaStockSDK`. The default is `3`. The delay between attempts can be
configured with `retryDelayMs` (default `1000` milliseconds). `fetchData` also
accepts optional third and fourth arguments to override these values per call.
If the environment variables `MAMASTOCK_RETRY_ATTEMPTS` or
`MAMASTOCK_RETRY_DELAY_MS` are set, they override the defaults when the
constructor options are omitted.
The helper calls `handleRateLimit` between attempts—override that method if you
need custom backoff logic. When running in environments without a global
`fetch` function, pass your own implementation with the `fetch` option when
instantiating the SDK. Set `timeoutMs` (default `10000`) to abort slow requests.
If `MAMASTOCK_TIMEOUT_MS` is defined it becomes the default when the option is
omitted. You can override the timeout per call by passing it as the fifth
argument to `fetchData`. The optional sixth parameter accepts an `AbortSignal`
so you can cancel a request manually before it times out.

You may update the SDK configuration later using `updateOptions`:

```ts
const sdk = new MamaStockSDK({ baseUrl: 'https://api' });
sdk.updateOptions({ token: 'new_jwt' }).updateOptions({ userAgent: 'app' });
```

`updateOptions` returns the SDK instance so calls can be chained.
When providing a custom `fetch` implementation, it must be a function.

Call `clearAuth()` to remove the stored API key and token:

```ts
sdk.clearAuth();
```

The method also returns the SDK instance for chaining configuration calls.

Use `setAuth()` to update credentials without touching other options:

```ts
sdk.setAuth({ apiKey: 'new_key', token: 'new_token' });
```

Set custom headers for all requests with `setHeaders()`:

```ts
sdk.setHeaders({ 'X-Custom': '1' });
```

Subsequent calls merge new headers with existing ones.

Remove specific headers later with `removeHeaders()`:

```ts
sdk.removeHeaders('X-Custom');
```

The SDK documentation is kept in sync with the Express routes. If you update the API authentication method, update this document and the README accordingly.
