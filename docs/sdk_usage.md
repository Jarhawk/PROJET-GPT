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
  famille: 'dessert'
});
```

When a `mamaId` is supplied (either per call or via the SDK constructor), it is appended to the request URL so the API can filter results for that establishment.

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

The SDK documentation is kept in sync with the Express routes. If you update the API authentication method, update this document and the README accordingly.
