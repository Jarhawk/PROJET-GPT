/* @ts-nocheck */
// Stub OCR facture — désactivé par défaut
import { useMemo } from 'react';

/**
 * Hook OCR factures (stub).
 * @returns {{ enabled: boolean, parse: (file: File|Blob) => Promise<{lines:any[], meta:any}> }}
 */
export default function useInvoiceOcr() {
  return useMemo(() => ({
    enabled: false,
    async parse() {
      // TODO: brancher un vrai moteur OCR plus tard
      return { lines: [], meta: {} };
    }
  }), []);
}
