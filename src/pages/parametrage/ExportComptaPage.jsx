import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from 'react-hot-toast';
import useExportCompta from '@/hooks/useExportCompta';

export default function ExportComptaPage() {
  const { generateJournalCsv, exportToERP, loading } = useExportCompta();
  const [mois, setMois] = useState(new Date().toISOString().slice(0,7));
  const [format, setFormat] = useState('csv');
  const [preview, setPreview] = useState([]);
  const [endpoint, setEndpoint] = useState('');
  const [token, setToken] = useState('');

  const handlePreview = async () => {
    const rows = await generateJournalCsv(mois, false);
    setPreview(rows);
  };

  const handleDownload = () => generateJournalCsv(mois, true);

  const handleSend = () => exportToERP(mois, endpoint, token);

  return (
    <div className="p-6 space-y-4">
      <Toaster position="top-right" />
      <h1 className="text-xl font-bold mb-2">Export comptable</h1>
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm">Mois</label>
          <input
            type="month"
            value={mois}
            onChange={(e) => setMois(e.target.value)}
            className="input input-bordered"
          />
        </div>
        <div>
          <label className="block text-sm">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="select select-bordered"
          >
            <option value="csv">📄 CSV</option>
            <option value="xml">🧾 XML</option>
            <option value="json">JSON</option>
            <option value="txt">TXT</option>
          </select>
        </div>
        <Button onClick={handlePreview} disabled={loading}>
          Aperçu
        </Button>
        <Button onClick={handleDownload} disabled={loading}>
          Télécharger
        </Button>
      </div>
      <div className="flex gap-4 items-end">
        <input
          className="input input-bordered flex-1"
          placeholder="Endpoint ERP"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        />
        <input
          className="input input-bordered"
          placeholder="Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <Button onClick={handleSend} disabled={!endpoint || loading}>
          🧮 Envoyer à ERP
        </Button>
      </div>
      {preview.length > 0 && (
        <div className="bg-white shadow rounded-xl overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Fournisseur</th>
                <th className="px-2 py-1">HT</th>
                <th className="px-2 py-1">TVA</th>
                <th className="px-2 py-1">TTC</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="odd:bg-gray-50">
                  <td className="px-2 py-1">{row.date}</td>
                  <td className="px-2 py-1">{row.fournisseur}</td>
                  <td className="px-2 py-1 text-right">{row.ht.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right">{row.tva.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right">{row.ttc.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
