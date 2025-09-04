declare module '../numberFormat' {
  export function formatMoneyFR(n: number): string;
  export function parseMoneyToNumberFR(s: string): number;
  export function normalizeDecimalFR(s: string): string;
}
