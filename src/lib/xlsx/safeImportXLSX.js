import * as XLSX from "xlsx";

export async function safeImportXLSX(file, sheetName = null, maxSize = 1000000) {
  if (!file || file.size > maxSize) throw new Error("Fichier invalide ou trop volumineux");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
  if (!sheet) throw new Error("Onglet introuvable");

  const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (json.length > 1000) throw new Error("Trop de lignes (max 1000)");

  return json;
}
