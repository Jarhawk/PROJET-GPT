import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from '@/lib/supabase';

// Colonnes exportées avec libellés lisibles
const EXPORT_HEADERS = [
  { key: "nom", header: "Nom" },
  { key: "unite", header: "Unité" },
  { key: "famille", header: "Famille" },
  { key: "sous_famille", header: "Sous-famille" },
  { key: "zone_stock", header: "Zone de stockage" },
  { key: "stock", header: "Stock" },
  { key: "pmp", header: "PMP" },
  { key: "actif", header: "Actif" },
  { key: "seuil_min", header: "Seuil min" },
];

// Template utilisé pour l'import de nouveaux produits
const TEMPLATE_HEADERS = [
  "nom",
  "famille",
  "sous_famille",
  "unite",
  "zone_stock",
  "stock_min",
  "actif",
];

export async function exportExcelProduits(mama_id) {
  const { data, error } = await supabase
    .from("produits")
    .select(
      `nom,
      unite:unites!fk_produits_unite(nom, mama_id),
      famille:familles!fk_produits_famille(nom, mama_id),
      sous_famille:sous_familles!fk_produits_sous_famille(nom, mama_id),
      zone_stock:zones_stock!produits_zone_stock_id_fkey(nom, mama_id),
      stock_theorique, pmp, actif, seuil_min`
    )
    .eq("mama_id", mama_id)
    .eq("unite.mama_id", mama_id)
    .eq("famille.mama_id", mama_id)
    .eq("sous_famille.mama_id", mama_id)
    .eq("zone_stock.mama_id", mama_id);

  if (error) throw error;

  const rows = [];
  const arr = Array.isArray(data) ? data : [];
  for (const p of arr) {
    rows.push({
      nom: p.nom,
      unite: p.unite?.nom || "",
      famille: p.famille?.nom || "",
      sous_famille: p.sous_famille?.nom || "",
      zone_stock: p.zone_stock?.nom || "",
      stock: p.stock_theorique ?? p.stock ?? 0,
      pmp: p.pmp ?? "",
      actif: p.actif ? "TRUE" : "FALSE",
      seuil_min: p.seuil_min ?? p.stock_min ?? 0,
    });
  }

  const wb = XLSX.utils.book_new();
  const headerKeys = [];
  for (const h of EXPORT_HEADERS) headerKeys.push(h.key);
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: headerKeys,
  });
  // Remplacer la ligne d'en-tête par des libellés lisibles
  const headerLabels = [];
  for (const h of EXPORT_HEADERS) headerLabels.push(h.header);
  XLSX.utils.sheet_add_aoa(ws, [headerLabels], { origin: "A1" });
  XLSX.utils.book_append_sheet(wb, ws, "Produits");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf]), "produits_export_mamastock.xlsx");
}

export function downloadProduitsTemplate() {
  const example = {};
  for (const h of TEMPLATE_HEADERS) example[h] = "";
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([example], { header: TEMPLATE_HEADERS });
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf]), "produits_template_mamastock.xlsx");
}

