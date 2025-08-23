import { expect, vi } from "vitest";
import '@testing-library/jest-dom';

process.env.VITE_SUPABASE_URL ??= 'https://example.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY ??= 'key';
process.env.SUPABASE_URL ??= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ??= 'key';

// Stubs pour anciens modules supprimés
vi.mock("@/license", () => ({ default: { validateLicense: () => true } }));
vi.mock("@/db/license-keys.json", () => ({ default: [] }));
vi.mock("@/utils/watermark", () => ({ addWatermark: (pdf: any) => pdf, clearWatermark: (pdf: any) => pdf }));

// Global mocks for auth and periodes hooks
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    mama_id: "m1",
    user_id: "u1",
    role: "admin",
    hasAccess: () => true,
  }),
}));

vi.mock("@/hooks/usePeriodes", () => ({
  default: () => ({
    checkCurrentPeriode: vi.fn().mockResolvedValue({ id: "p1" }),
  }),
}));

// Polyfills Node pour jsdom/tests
// TextEncoder/TextDecoder (si nécessaire)
import { TextEncoder, TextDecoder } from "node:util";
if (!globalThis.TextEncoder) globalThis.TextEncoder = TextEncoder as any;
if (!globalThis.TextDecoder) globalThis.TextDecoder = TextDecoder as any;

// crypto.subtle (si des libs le demandent)
import crypto from "node:crypto";
if (!globalThis.crypto) (globalThis as any).crypto = crypto.webcrypto;

// DOMRect (certains graphiques)
if (!(globalThis as any).DOMRect) {
  (globalThis as any).DOMRect = class DOMRect {
    x: number; y: number; width: number; height: number; top: number; left: number; bottom: number; right: number;
    constructor(x=0,y=0,w=0,h=0){ this.x=x; this.y=y; this.width=w; this.height=h; this.top=y; this.left=x; this.bottom=y+h; this.right=x+w; }
    static fromRect(other:any){ return new (this as any)(other?.x, other?.y, other?.width, other?.height); }
  } as any;
}

// fetch si besoin
if (!globalThis.fetch) {
  globalThis.fetch = (...args:any) => import("node-fetch").then(({default: f}) => f(...args)) as any;
}

// Conseils pour tests async : expect(await fn()) et utiliser `await` sur hooks async.

// A chainable query stub for Supabase queries
function queryChain() {
  const self: any = {};
  const ret = () => self;

  self.select = vi.fn(ret);
  self.eq = vi.fn(ret);
  self.in = vi.fn(ret);
  self.ilike = vi.fn(ret);
  self.order = vi.fn(ret);
  self.range = vi.fn(ret);
  self.insert = vi.fn(async () => ({ data: [], error: null }));
  self.update = vi.fn(async () => ({ data: [], error: null }));
  self.delete = vi.fn(async () => ({ data: [], error: null }));
  self.single = vi.fn(async () => ({ data: null, error: null }));
  return self;
}

vi.mock('@/lib/supabase', () => {
  const fromMock = vi.fn(() => queryChain());
  const rpcMock = vi.fn(async () => ({ data: [], error: null }));
  const auth = {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(async () => ({ data: { session: null } }))
  };
  return { supabase: { from: fromMock, rpc: rpcMock, auth } };
});

// For tests with custom vi.mock factories, avoid referencing top-level
// variables inside the factory. Define them within the factory or use
// vi.hoisted(() => ({})) to prevent initialization errors.

export { expect, vi };
