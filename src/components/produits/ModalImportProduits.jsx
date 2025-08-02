import { useRef, useState } from "react";
import SmartDialog from "@/components/ui/SmartDialog";
import ImportPreviewTable from "@/components/ui/ImportPreviewTable";
import {
  parseProduitsFile,
  insertProduits,
  validateProduitRow,
} from "@/utils/importExcelProduits";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function ModalImportProduits({ open, onClose, onSuccess }) {
  const { mama_id } = useAuth();
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [maps, setMaps] = useState(null);
  const [reference, setReference] = useState({ familles: [], unites: [], zones: [] });
  const [importing, setImporting] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const parsed = await parseProduitsFile(file, mama_id);
    setRows(parsed.rows);
    setMaps(parsed.maps);
    setReference({ familles: parsed.familles, unites: parsed.unites, zones: parsed.zones });
    if (fileRef.current) fileRef.current.value = "";
  }

  const validCount = rows.filter((r) => r.status === "ok").length;
  const invalidCount = rows.length - validCount;

  async function handleImport() {
    const validRows = rows.filter((r) => r.status === "ok");
    if (!validRows.length) return;
    setImporting(true);
    const results = await insertProduits(validRows);
    const failed = results.filter((r) => r.insertError);
    const successCount = results.length - failed.length;
    if (successCount) toast.success(`${successCount} produits importés`);
    if (failed.length) toast.error(`${failed.length} erreurs d'insertion`);
    setImporting(false);
    onSuccess?.();
  }

  function handleUpdate(newRows) {
    setRows(newRows.map((r) => (maps ? validateProduitRow(r, maps) : r)));
  }

  return (
    <SmartDialog open={open} onClose={onClose} title="Importer Produits via Excel">
      <div className="space-y-4">
        <input
          type="file"
          accept=".xlsx,.csv"
          ref={fileRef}
          onChange={handleFileChange}
          className="block"
        />
        {rows.length > 0 && (
          <>
            <div className="flex justify-between my-2 text-sm">
              <span>{rows.length} lignes chargées</span>
              <span>
                {validCount} valides / {invalidCount} à corriger
              </span>
            </div>
            <div className="max-h-[500px] overflow-y-auto border rounded">
              <ImportPreviewTable
                rows={rows}
                onUpdate={handleUpdate}
                maps={maps}
                reference={reference}
              />
            </div>
            <Button
              disabled={invalidCount > 0 || importing}
              onClick={handleImport}
            >
              Importer maintenant
            </Button>
          </>
        )}
      </div>
    </SmartDialog>
  );
}
