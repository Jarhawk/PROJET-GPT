// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export * from './produits';
export * from './stock';

export interface SDKOptions {
  baseUrl: string;
  apiKey?: string;
  token?: string;
}

export class MamaStockSDK {
  baseUrl: string;
  apiKey?: string;
  token?: string;
  constructor(options: SDKOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.token = options.token;
  }

  async fetchData(endpoint: string, params: Record<string, string> = {}) {
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const query = Object.keys(params).length
      ? `?${new URLSearchParams(params).toString()}`
      : '';

    const res = await fetch(`${this.baseUrl}${endpoint}${query}`, { headers });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async handleRateLimit() {
    // Attente simple lorsque la limite est atteinte
    await new Promise(r => setTimeout(r, 1000));
  }
}
