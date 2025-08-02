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
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const [famillesRes, sousFamillesRes, unitesRes, zonesRes, fournisseursRes] =
    await Promise.all([
      supabase.from("familles").select("id, nom").eq("mama_id", mama_id),
      supabase.from("sous_familles").select("id, nom").eq("mama_id", mama_id),
      supabase.from("unites").select("id, nom").eq("mama_id", mama_id),
      supabase.from("zones_stock").select("id, nom").eq("mama_id", mama_id),
      supabase.from("fournisseurs").select("id").eq("mama_id", mama_id),
    ]);

  const mapByName = (res) =>
    new Map((res.data || []).map((x) => [x.nom.toLowerCase(), x.id]));
  const famillesMap = mapByName(famillesRes);
  const sousFamillesMap = mapByName(sousFamillesRes);
  const unitesMap = mapByName(unitesRes);
  const zonesMap = mapByName(zonesRes);
  const fournisseurIds = new Set((fournisseursRes.data || []).map((f) => String(f.id)));

  return raw.map((r) => {
    const n = Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k.toLowerCase().trim(), typeof v === "string" ? v.trim() : v])
    );

    const row = {
      id: uuidv4(),
      nom: String(n.nom || "").trim(),
      famille_nom: String(n.famille || "").trim(),
      sous_famille_nom: String(n.sous_famille || "").trim(),
      unite_nom: String(n.unite || "").trim(),
      zone_stock_nom: String(n.zone_stock || "").trim(),
      code: String(n.code || "").trim(),
      allergenes: String(n.allergenes || "").trim(),
      actif: parseBoolean(n.actif),
      pmp: n.pmp !== "" ? Number(n.pmp) : null,
      stock_theorique: n.stock_theorique !== "" ? Number(n.stock_theorique) : null,
      stock_min: n.stock_min !== "" ? Number(n.stock_min) : null,
      dernier_prix: n.dernier_prix !== "" ? Number(n.dernier_prix) : null,
      fournisseur_id: String(n.fournisseur_id || "").trim() || null,
      famille_id: null,
      sous_famille_id: null,
      unite_id: null,
      zone_stock_id: null,
      mama_id,
      errors: [],
    };

    if (!row.nom) row.errors.push("nom manquant");

    row.famille_id = famillesMap.get(row.famille_nom.toLowerCase());
    if (!row.famille_id) row.errors.push("famille inconnue");

    row.sous_famille_id = sousFamillesMap.get(row.sous_famille_nom.toLowerCase());
    if (row.sous_famille_nom && !row.sous_famille_id)
      row.errors.push("sous_famille inconnue");

    row.unite_id = unitesMap.get(row.unite_nom.toLowerCase());
    if (!row.unite_id) row.errors.push("unite inconnue");

    row.zone_stock_id = zonesMap.get(row.zone_stock_nom.toLowerCase());
    if (!row.zone_stock_id) row.errors.push("zone_stock inconnue");

    if (row.fournisseur_id && !fournisseurIds.has(row.fournisseur_id))
      row.errors.push("fournisseur inconnu");

    return row;
  });
}

export async function insertProduits(rows) {
  const results = [];
  for (const r of rows) {
    const { errors: _e, famille_nom: _fa, sous_famille_nom: _sf, unite_nom: _u, zone_stock_nom: _z, ...payload } = r;
    payload.seuil_min = payload.stock_min;
    delete payload.stock_min;
    try {
      const { data, error } = await supabase
        .from("produits")
        .insert([payload])
        .select("id")
        .single();
      if (error) results.push({ ...r, insertError: error.message });
      else results.push({ ...r, id: data.id, insertError: null });
    } catch (err) {
      results.push({ ...r, insertError: err.message });
    }
  }
  return results;
}

