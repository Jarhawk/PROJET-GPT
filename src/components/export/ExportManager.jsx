// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import ModalGlass from '@/components/ui/ModalGlass';
import { Button } from '@/components/ui/button';

export default function ExportManager({ open, onClose, onExport }) {
  const [format, setFormat] = useState('pdf');
  const [type, setType] = useState('fiches');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const handleExport = () => {
    onExport?.({ format, type, options: { start, end } });
    onClose?.();
  };

  return (
    <ModalGlass open={open} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Exporter les données</h2>
      <div className="mb-2">
        <label className="block text-sm mb-1">Format</label>
        <select
          className="form-select w-full"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
          <option value="csv">CSV</option>
          <option value="print">Impression</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-sm mb-1">Données</label>
        <select
          className="form-select w-full"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="fiches">Fiches techniques</option>
          <option value="inventaire">Inventaire</option>
          <option value="produits">Produits</option>
          <option value="factures">Factures</option>
        </select>
      </div>
      {type === 'factures' && (
        <div className="flex gap-2 mb-2">
          <input
            type="date"
            className="form-input w-full"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            type="date"
            className="form-input w-full"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      )}
      <div className="text-right mt-4">
        <Button onClick={handleExport}>Exporter</Button>
      </div>
    </ModalGlass>
  );
}
