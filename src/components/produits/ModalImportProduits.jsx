import { useState, useRef } from "react";
import ModalGlass from "@/components/ui/ModalGlass";
import ImportPreviewTable from "@/components/ui/ImportPreviewTable";
import { parseProduitsFile, insertProduits } from "@/utils/importExcelProduits";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function ModalImportProduits({ open, onClose, onSuccess }) {
  const { mama_id } = useAuth();
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const parsed = await parseProduitsFile(file, mama_id);
    setRows(parsed);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.errors.length === 0);
    if (!validRows.length) return;
    setImporting(true);
    const results = await insertProduits(validRows);
    const invalid = rows.filter((r) => r.errors.length > 0);
    const failed = results.filter((r) => r.insertError);
    const successCount = results.length - failed.length;
    if (successCount) toast.success(`${successCount} produits importés`);
    if (failed.length) toast.error(`${failed.length} erreurs d'insertion`);
    setRows([...invalid, ...results]);
    setImporting(false);
    if (onSuccess) onSuccess();
  }

  return (
    <ModalGlass open={open} onClose={onClose}>
      <div className="space-y-4">
        <input
          type="file"
          accept=".xlsx,.csv"
          ref={fileRef}
          onChange={handleFileChange}
        />
        {rows.length > 0 && (
          <ImportPreviewTable rows={rows} onImport={handleImport} importing={importing} />
        )}
        <div className="text-right">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </ModalGlass>
  );
}

