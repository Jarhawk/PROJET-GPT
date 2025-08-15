// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import supabase from '@/lib/supabaseClient';

export function useInvoiceImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function importFromFile(file) {
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const { data, error } = await supabase.rpc("import_invoice", { payload });
      setLoading(false);
      if (error) {
        setError(error.message || error);
        return null;
      }
      return data;
    } catch (err) {
      setLoading(false);
      setError(err.message || err);
      return null;
    }
  }

  return { importFromFile, loading, error };
}
