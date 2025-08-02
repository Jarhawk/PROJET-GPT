import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabase";

const HEADERS = [
  "nom",
  "famille",
  "sous_famille",
  "unite",
  "zone_stock",
  "code",
  "allergenes",
  "actif",
  "pmp",
  "stock_theorique",
  "stock_min",
  "dernier_prix",
  "fournisseur_id",
];

export async function exportExcelProduits(mama_id) {
  const { data, error } = await supabase
    .from("produits")
    .select(
      `nom, famille:familles(nom), sous_famille:sous_familles(nom), unite:unites(nom), zone_stock:zones_stock(nom), code, allergenes, actif, pmp, stock_theorique, seuil_min, dernier_prix, fournisseur_id`
    )
    .eq("mama_id", mama_id);

  if (error) throw error;

  const rows = (data || []).map((p) => ({
    nom: p.nom,
    famille: p.famille?.nom || "",
    sous_famille: p.sous_famille?.nom || "",
    unite: p.unite?.nom || "",
    zone_stock: p.zone_stock?.nom || "",
    code: p.code || "",
    allergenes: p.allergenes || "",
    actif: p.actif ? "TRUE" : "FALSE",
    pmp: p.pmp ?? "",
    stock_theorique: p.stock_theorique ?? "",
    stock_min: p.seuil_min ?? "",
    dernier_prix: p.dernier_prix ?? "",
    fournisseur_id: p.fournisseur_id || "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  XLSX.utils.book_append_sheet(wb, ws, "Produits");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf]), "produits_export_mamastock.xlsx");
}

export function downloadProduitsTemplate() {
  const example = Object.fromEntries(HEADERS.map((h) => [h, ""]));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([example], { header: HEADERS });
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf]), "produits_template_mamastock.xlsx");
}

