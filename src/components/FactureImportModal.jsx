// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import SmartDialog from "@/components/ui/SmartDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

export default function FactureImportModal({ open, onClose, onImport }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
    setRows(json.map(r => ({ ...r })));
  };

  const handleChange = (idx, field, value) => {
    setRows(rs => rs.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const invalid = row => !row.produit || !row.quantite;

  return (
    <SmartDialog open={open} onClose={onClose} title="Import Excel">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input type="file" accept=".xlsx,.xls" onChange={handleFile} />
          <a
            href="/factures_template.xlsx"
            download
            className="text-sm text-mamastockGold underline"
          >
            Télécharger le template Excel
          </a>
        </div>
        {fileName && <p className="text-sm">Prévisualisation : {fileName}</p>}
        <div className="max-h-60 overflow-auto border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {rows[0] && Object.keys(rows[0]).map(k => (
                  <th key={k} className="px-2 py-1 text-left sticky top-0 bg-black/30">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className={invalid(r) ? "bg-red-200/20" : ""}>
                  {Object.keys(r).map(k => (
                    <td key={k} className="p-1">
                      <Input
                        value={r[k]}
                        onChange={e => handleChange(idx, k, e.target.value)}
                        className="text-xs bg-transparent"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            disabled={!rows.length || rows.some(invalid)}
            onClick={() => onImport?.(rows)}
          >
            Importer
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </SmartDialog>
  );
}
