import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabase";

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
      `nom, unite_id, unite:unite_id (nom), famille:familles(nom), sous_famille:sous_familles(nom), zone_stock:zones_stock(nom), stock_theorique, pmp, actif, seuil_min`
    )
    .eq("mama_id", mama_id);

  if (error) throw error;

  const rows = (data || []).map((p) => ({
    nom: p.nom,
    unite: p.unite?.nom || "",
    famille: p.famille?.nom || "",
    sous_famille: p.sous_famille?.nom || "",
    zone_stock: p.zone_stock?.nom || "",
    stock: p.stock_theorique ?? p.stock ?? 0,
    pmp: p.pmp ?? "",
    actif: p.actif ? "TRUE" : "FALSE",
    seuil_min: p.seuil_min ?? p.stock_min ?? 0,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: EXPORT_HEADERS.map((h) => h.key),
  });
  // Remplacer la ligne d'en-tête par des libellés lisibles
  XLSX.utils.sheet_add_aoa(
    ws,
    [EXPORT_HEADERS.map((h) => h.header)],
    { origin: "A1" }
  );
  XLSX.utils.book_append_sheet(wb, ws, "Produits");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf]), "produits_export_mamastock.xlsx");
}

export function downloadProduitsTemplate() {
  const example = Object.fromEntries(TEMPLATE_HEADERS.map((h) => [h, ""]));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([example], { header: TEMPLATE_HEADERS });
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf]), "produits_template_mamastock.xlsx");
}

