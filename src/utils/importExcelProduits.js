import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const str = String(value).toLowerCase().trim();
  if (["true", "vrai", "1", "yes", "oui"].includes(str)) return true;
  if (["false", "faux", "0", "no", "non"].includes(str)) return false;
  return false;
}

export async function parseProduitsFile(file, mama_id) {
  let workbook;
  if (file.name.endsWith(".csv")) {
    const text = await file.text();
    workbook = XLSX.read(text, { type: "string" });
  } else {
    const data = await file.arrayBuffer();
    workbook = XLSX.read(data, { type: "array" });
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const rows = [];

  for (const r of raw) {
    const row = Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k.toLowerCase().trim(), v]),
    );
    if (Object.values(row).every((v) => String(v).trim() === "")) continue;

    const produit = {
      id: row.id ? String(row.id).trim() : uuidv4(),
      nom: String(row.nom || "").trim(),
      famille: String(row.famille || "").trim(),
      unite: String(row.unite || "").trim(),
      code: String(row.code || "").trim(),
      allergenes: String(row.allergenes || "").trim(),
      pmp: parseFloat(row.pmp) || 0,
      stock_theorique: parseFloat(row.stock_theorique) || 0,
      stock_min: parseFloat(row.stock_min) || 0,
      dernier_prix: parseFloat(row.dernier_prix) || 0,
      actif: parseBoolean(row.actif),
      mama_id,
    };

    const errors = [];
    if (!produit.nom) errors.push("nom manquant");
    if (!produit.famille) errors.push("famille manquante");
    if (!produit.unite) errors.push("unite manquante");
    if (row.pmp && isNaN(parseFloat(row.pmp))) errors.push("pmp invalide");
    if (row.stock_theorique && isNaN(parseFloat(row.stock_theorique)))
      errors.push("stock_theorique invalide");
    if (row.stock_min && isNaN(parseFloat(row.stock_min)))
      errors.push("stock_min invalide");
    if (row.dernier_prix && isNaN(parseFloat(row.dernier_prix)))
      errors.push("dernier_prix invalide");

    rows.push({ ...produit, errors });
  }
  return rows;
}

export async function insertProduits(rows) {
  const results = [];
  for (const row of rows) {
    const { errors: _errors, ...payload } = row;
    try {
      const { error } = await supabase.from("produits").insert([payload]);
      if (error) {
        results.push({ ...row, insertError: error.message });
      } else {
        results.push({ ...row, insertError: null });
      }
    } catch (e) {
      results.push({ ...row, insertError: e.message });
    }
  }
  return results;
}

