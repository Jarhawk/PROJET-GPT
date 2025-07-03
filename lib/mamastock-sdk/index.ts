// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export * from './produits';
export * from './stock';

export interface SDKOptions {
  /** Base URL of the public API. If omitted, MAMASTOCK_BASE_URL env is used */
  baseUrl?: string;
  apiKey?: string;
  token?: string;
  /** Default mama_id applied to all requests when none is provided */
  mamaId?: string;
  retryAttempts?: number;
  retryDelayMs?: number;
  /** Request timeout in ms. Defaults to MAMASTOCK_TIMEOUT_MS or 10000 */
  timeoutMs?: number;
  fetch?: typeof fetch;
  /** User-Agent header value sent with each request */
  userAgent?: string;
}

export class MamaStockSDK {
  baseUrl: string;
  apiKey?: string;
  token?: string;
  mamaId?: string;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
  fetch: typeof fetch;
  userAgent: string;
  constructor(options: SDKOptions = { baseUrl: undefined }) {
    const envUrl =
      (typeof process !== 'undefined' && process.env.MAMASTOCK_BASE_URL) || '';
    const envAgent =
      (typeof process !== 'undefined' && process.env.MAMASTOCK_USER_AGENT) || '';
    const envKey =
      (typeof process !== 'undefined' && process.env.MAMASTOCK_API_KEY) || '';
    const envToken =
      (typeof process !== 'undefined' && process.env.MAMASTOCK_TOKEN) || '';
    const envMamaId =
      (typeof process !== 'undefined' && process.env.MAMASTOCK_MAMA_ID) || '';
    const envRetry =
      (typeof process !== 'undefined' && process.env.MAMASTOCK_RETRY_ATTEMPTS) ||
      '';
    const envDelay =
      (typeof process !== 'undefined' && process.env.MAMASTOCK_RETRY_DELAY_MS) ||
      '';
    const envTimeout =
      (typeof process !== 'undefined' && process.env.MAMASTOCK_TIMEOUT_MS) || '';
    const base = options.baseUrl ?? envUrl;
    if (!base) {
      throw new Error('Missing baseUrl');
    }
    if (!/^https?:\/\//.test(base)) {
      throw new Error('Invalid baseUrl');
    }
    this.baseUrl = base.replace(/\/$/, '');
    this.apiKey = options.apiKey ?? (envKey || undefined);
    this.token = options.token ?? (envToken || undefined);
    this.mamaId = options.mamaId ?? (envMamaId || undefined);
    const retryNum = Number(envRetry);
    const delayNum = Number(envDelay);
    const timeoutNum = Number(envTimeout);
    this.retryAttempts =
      options.retryAttempts ??
      (Number.isFinite(retryNum) && retryNum > 0 ? retryNum : 3);
    this.retryDelayMs =
      options.retryDelayMs ??
      (Number.isFinite(delayNum) && delayNum > 0 ? delayNum : 1000);
    this.timeoutMs =
      options.timeoutMs ??
      (Number.isFinite(timeoutNum) && timeoutNum > 0 ? timeoutNum : 10000);
    this.fetch = options.fetch ?? fetch;
    this.userAgent = (options.userAgent ?? envAgent) || 'MamaStockSDK';
  }

  async fetchData(
    endpoint: string,
    params: Record<string, string> = {},
    attempts = this.retryAttempts,
    delayMs = this.retryDelayMs,
    timeoutMs = this.timeoutMs,
    /** Optional AbortSignal to cancel the request manually */
    signal?: AbortSignal,
  ) {
    const headers: Record<string, string> = { 'User-Agent': this.userAgent };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const query = Object.keys(params).length
      ? `?${new URLSearchParams(params).toString()}`
      : '';

    let res: Response;
    for (let i = 0; i < attempts; i++) {
      const timeoutSignal = AbortSignal.timeout(timeoutMs);
      const combined = signal
        ? AbortSignal.any([timeoutSignal, signal])
        : timeoutSignal;
      try {
        res = await this.fetch(`${this.baseUrl}${endpoint}${query}`, {
          headers,
          signal: combined,
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          if (timeoutSignal.aborted && !(signal && signal.aborted)) {
            throw new Error('Request timed out');
          }
          throw new Error('Request aborted');
        }
        throw err;
      }
      if (res.status !== 429 && res.status !== 503) break;
      await this.handleRateLimit(delayMs * (i + 1));
    }
    if (!res!.ok) throw new Error(`Request failed: ${res!.status}`);
    return res!.json();
  }

  async handleRateLimit(ms: number) {
    // Attente simple lorsque la limite est atteinte
    await new Promise((r) => setTimeout(r, ms));
  }
}
