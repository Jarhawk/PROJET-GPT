import { expect, vi } from "vitest";

// Stubs pour anciens modules supprimés
vi.mock("@/license", () => ({ default: { validateLicense: () => true } }));
vi.mock("@/db/license-keys.json", () => ({ default: [] }));
vi.mock("@/utils/watermark", () => ({ addWatermark: (pdf) => pdf, clearWatermark: (pdf) => pdf }));

// Default auth hook mock
vi.mock("@/hooks/useAuth", async () => {
  const mod = await import("./__mocks__/hooks/useAuth.ts");
  return { useAuth: mod.useAuth };
});

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
    constructor(x=0,y=0,w=0,h=0){ this.x=x; this.y=y; this.width=w; this.height=h; this.top=y; this.left=x; this.bottom=y+h; this.right=x+w; }
    static fromRect(other:any){ return new (this as any)(other?.x, other?.y, other?.width, other?.height); }
  } as any;
}

// fetch si besoin
if (!globalThis.fetch) {
  globalThis.fetch = (...args:any) => import("node-fetch").then(({default: f}) => f(...args)) as any;
}

// Conseils pour tests async : expect(await fn()) et utiliser `await` sur hooks async.

export { expect, vi };
