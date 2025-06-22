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

  async fetchData(endpoint: string) {
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`${this.baseUrl}${endpoint}`, { headers });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async handleRateLimit() {
    // Attente simple lorsque la limite est atteinte
    await new Promise(r => setTimeout(r, 1000));
  }
}
