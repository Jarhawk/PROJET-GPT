import { useEffect, useRef, useState } from "react";
import SmartDialog from "@/components/ui/SmartDialog";
import ImportPreviewTable from "@/components/ui/ImportPreviewTable";
import {
  parseProduitsFile,
  validateProduitRow,
  downloadProduitsTemplate,
} from "@/utils/excelUtils";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function ModalImportProduits({ open, onClose, onSuccess }) {
  const { mama_id } = useAuth();
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [maps, setMaps] = useState(null);
  const [reference, setReference] = useState({
    familles: [],
    sousFamilles: [],
    unites: [],
    zones: [],
  });
  const [importing, setImporting] = useState(false);
  const [ignoredMessages, setIgnoredMessages] = useState([]);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const parsed = await parseProduitsFile(file, mama_id);
    setRows(parsed.rows);
    setMaps(parsed.maps);
    setReference({
      familles: parsed.familles,
      sousFamilles: parsed.sousFamilles,
      unites: parsed.unites,
      zones: parsed.zones,
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  const validCount = rows.filter((r) => r.status === "ok").length;
  const invalidCount = rows.length - validCount;

  function formatRowErrors(row) {
    const errors = [];
    if (row.errors?.nom) errors.push("Nom manquant");
    if (row.errors?.famille_nom)
      errors.push(`Famille '${row.famille_nom}' introuvable.`);
    if (row.errors?.sous_famille_nom)
      errors.push(`Sous-famille '${row.sous_famille_nom}' introuvable.`);
    if (row.errors?.unite_nom)
      errors.push(`Unité '${row.unite_nom}' introuvable.`);
    if (row.errors?.zone_stock_nom)
      errors.push(`Zone stock '${row.zone_stock_nom}' introuvable.`);
    if (row.errors?.fournisseur_id)
      errors.push(`Fournisseur '${row.fournisseur_id}' inconnu.`);
    return errors.join(", ");
  }

  useEffect(() => {
    const msgs = rows
      .map((r, idx) =>
        r.status === "error" ? `Ligne ${idx + 1} : ${formatRowErrors(r)}` : null
      )
      .filter(Boolean);
    setIgnoredMessages(msgs);
  }, [rows]);

  async function handleImport() {
    const produits_valides = [];
    rows.forEach((row, idx) => {
      if (row.status === "ok") {
        produits_valides.push({
          nom: row.nom,
          unite_id: row.unite_id,
          famille_id: row.famille_id,
          zone_stock_id: row.zone_stock_id,
          stock_min: row.stock_min ?? 0,
          actif: row.actif ?? true,
          sous_famille_id: row.sous_famille_id || null,
          code: row.code || null,
          allergenes: row.allergenes || null,
          mama_id,
        });
      } else {
        const reason = formatRowErrors(row) || "données invalides";
        console.warn("Produit ignoré", idx + 1, reason);
      }
    });
    if (!produits_valides.length) return;
    setImporting(true);
    const { error } = await supabase
      .from("produits")
      .insert(produits_valides);
    if (error) {
      console.error(error);
      toast.error("Erreur d'insertion");
    } else {
      toast(
        `${produits_valides.length} produits insérés · ${rows.length - produits_valides.length} ignorés`
      );
      onSuccess?.();
    }
    setImporting(false);
  }

  function handleUpdate(newRows) {
    setRows(newRows.map((r) => (maps ? validateProduitRow(r, maps) : r)));
  }

  return (
    <SmartDialog open={open} onClose={onClose} title="Importer Produits via Excel">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={downloadProduitsTemplate} type="button">
            Télécharger modèle Excel
          </Button>
        </div>
        <input
          type="file"
          accept=".xlsx,.csv"
          ref={fileRef}
          onChange={handleFileChange}
          className="block"
        />
        {rows.length > 0 ? (
          <>
            <div className="flex justify-between my-2 text-sm">
              <span>{rows.length} lignes chargées</span>
              <span>
                {validCount} valides / {invalidCount} à corriger
              </span>
            </div>
            <div
              className={`${
                rows.length > 20 ? "max-h-[500px] overflow-y-auto" : ""
              } border rounded`}
            >
              <ImportPreviewTable
                rows={rows}
                onUpdate={handleUpdate}
                maps={maps}
                reference={reference}
              />
            </div>
            {ignoredMessages.map((msg, i) => (
              <p key={i} className="text-xs text-red-600">
                {msg}
              </p>
            ))}
            <Button
              disabled={validCount === 0 || importing}
              onClick={handleImport}
            >
              Valider l'import
            </Button>
          </>
        ) : (
          <p className="text-sm text-center text-muted-foreground">
            Aucune ligne importée
          </p>
        )}
      </div>
    </SmartDialog>
  );
}
