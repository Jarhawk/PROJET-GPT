import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseClient } from '@/lib/supabase';
import { fetchFamillesForValidation } from "@/hooks/useFamilles";
import { fetchUnitesForValidation } from "@/hooks/useUnites";
import { fetchZonesForValidation } from "@/hooks/useZonesStock";

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const str = String(value).toLowerCase().trim();
  if (["true", "vrai", "1", "yes", "oui"].includes(str)) return true;
  if (["false", "faux", "0", "no", "non"].includes(str)) return false;
  return false;
}

export function validateProduitRow(row, maps) {
  const errors = {};
  if (!row.nom) errors.nom = "nom manquant";

  const famId = maps.familles.get((row.famille_nom || "").toLowerCase());
  if (!famId) errors.famille_nom = "famille inconnue";

  const sfName = (row.sous_famille_nom || "").toLowerCase();
  const sfId = sfName ? maps.sousFamilles.get(sfName) : null;
  if (row.sous_famille_nom && !sfId) errors.sous_famille_nom = "sous_famille inconnue";

  const uniteId = maps.unites.get((row.unite_nom || "").toLowerCase());
  if (!uniteId) errors.unite_nom = "unite inconnue";

  const zoneId = maps.zones.get((row.zone_stock_nom || "").toLowerCase());
  if (!zoneId) errors.zone_stock_nom = "zone_stock inconnue";

  if (row.fournisseur_id && !maps.fournisseurs.has(String(row.fournisseur_id)))
    errors.fournisseur_id = "fournisseur inconnu";

  const status = Object.keys(errors).length ? "error" : "ok";

  return {
    ...row,
    famille_id: famId || null,
    sous_famille_id: sfId || null,
    unite_id: uniteId || null,
    zone_stock_id: zoneId || null,
    errors,
    status,
  };
}

export async function parseProduitsFile(file, mama_id) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const supabase = getSupabaseClient();
  const [
    famillesRes,
    sousFamillesRes,
    unitesRes,
    zonesRes,
    fournisseursRes,
    produitsRes,
  ] = await Promise.all([
    fetchFamillesForValidation(supabase, mama_id),
    supabase.from("sous_familles").select("id, nom").eq("mama_id", mama_id),
    fetchUnitesForValidation(mama_id),
    fetchZonesForValidation(mama_id),
    supabase.from("fournisseurs").select("id").eq("mama_id", mama_id),
    supabase.from("produits").select("nom").eq("mama_id", mama_id),
  ]);

  const mapByName = (res) =>
    new Map((res.data || []).map((x) => [x.nom.toLowerCase(), x.id]));
  const famillesMap = mapByName(famillesRes);
  const sousFamillesMap = mapByName(sousFamillesRes);
  const unitesMap = mapByName(unitesRes);
  const zonesMap = mapByName(zonesRes);
  const fournisseurIds = new Set(
    (fournisseursRes.data || []).map((f) => String(f.id))
  );

  const existingNames = new Set(
    (produitsRes.data || []).map((p) => p.nom.toLowerCase())
  );

  const maps = {
    familles: famillesMap,
    sousFamilles: sousFamillesMap,
    unites: unitesMap,
    zones: zonesMap,
    fournisseurs: fournisseurIds,
  };

  const seenNames = new Set();

  const rows = raw.map((r) => {
    const n = Object.fromEntries(
      Object.entries(r).map(([k, v]) => [
        k.toLowerCase().trim(),
        typeof v === "string" ? v.trim() : v,
      ])
    );

    const baseRow = {
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
      stock_theorique:
        n.stock_theorique !== "" ? Number(n.stock_theorique) : null,
      stock_min: n.stock_min !== "" ? Number(n.stock_min) : null,
      dernier_prix: n.dernier_prix !== "" ? Number(n.dernier_prix) : null,
      fournisseur_id: String(n.fournisseur_id || "").trim() || null,
      mama_id,
    };

    let validated = validateProduitRow(baseRow, maps);
    const lowerName = validated.nom.toLowerCase();
    if (existingNames.has(lowerName) || seenNames.has(lowerName)) {
      validated.errors.nom = validated.errors.nom
        ? `${validated.errors.nom}, déjà existant`
        : "produit déjà existant";
      validated.status = "error";
    }
    seenNames.add(lowerName);
    return validated;
  });

  return {
    rows,
    maps,
    familles: famillesRes.data || [],
    sousFamilles: sousFamillesRes.data || [],
    unites: unitesRes.data || [],
    zones: zonesRes.data || [],
  };
}

export async function insertProduits(rows) {
  const supabase = getSupabaseClient();
  const results = [];
  for (const r of rows) {
    const {
      errors: _e,
      status: _s,
      famille_nom: _fa,
      sous_famille_nom: _sf,
      unite_nom: _u,
      zone_stock_nom: _z,
      ...payload
    } = r;
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

