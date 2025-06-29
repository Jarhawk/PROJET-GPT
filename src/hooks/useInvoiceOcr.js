// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { createWorker } from 'tesseract.js';

export function useInvoiceOcr() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function scan(file) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const worker = await createWorker();
      await worker.loadLanguage('fra');
      await worker.initialize('fra');
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setText(data.text || '');
      return data.text || '';
    } catch (err) {
      setError(err);
      return '';
    } finally {
      setLoading(false);
    }
  }

  return { text, loading, error, scan };
}
