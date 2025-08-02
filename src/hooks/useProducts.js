// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useProducts.js
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

export function useProducts() {
  const { mama_id } = useAuth();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async ({
    search = "",
    sousFamille = "",
    zone = "",
    actif = null,
    page = 1,
    limit = 100,
    sortBy = "nom",
    order = "asc",
  } = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from("produits")
      .select(
        `*, famille:familles!fk_produits_famille(nom), sous_famille:sous_familles!fk_produits_sous_famille(nom), unite:unites!fk_produits_unite(nom), zone_stock:zones_stock!fk_produits_zone_stock(nom), main_fournisseur:fournisseur_id(nom)`,
        { count: "exact" }
      )
      .eq("mama_id", mama_id);

    if (search) {
      query = query.ilike("nom", `%${search}%`);
    }
    if (sousFamille) query = query.eq("sous_famille_id", sousFamille);
    if (zone) query = query.eq("zone_stock_id", zone);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    if (sortBy === "zone_stock") {
      query = query
        .order("nom", { foreignTable: "zone_stock", ascending: order === "asc" })
        .order("nom", { foreignTable: "famille", ascending: order === "asc" })
        .order("nom", { ascending: order === "asc" });
    } else if (sortBy === "famille") {
      query = query
        .order("nom", { foreignTable: "famille", ascending: order === "asc" })
        .order("nom", { foreignTable: "sous_famille", ascending: order === "asc" })
        .order("nom", { ascending: order === "asc" });
    } else if (sortBy === "unite") {
      query = query
        .order("nom", { foreignTable: "unite", ascending: order === "asc" })
        .order("nom", { ascending: order === "asc" });
    } else {
      query = query.order(sortBy, { ascending: order === "asc" }).order("nom", { ascending: order === "asc" });
    }
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    const [
      { data: pmpData },
      { data: stockData },
    ] = await Promise.all([
      supabase.from('v_pmp').select('produit_id, pmp').eq('mama_id', mama_id),
      supabase.from('v_stocks').select('produit_id, stock').eq('mama_id', mama_id),
    ]);
    const pmpMap = Object.fromEntries((pmpData || []).map(p => [p.produit_id, p.pmp]));
    const stockMap = Object.fromEntries((stockData || []).map(s => [s.produit_id, s.stock]));
    const final = (Array.isArray(data) ? data : []).map((p) => ({
      ...p,
      unite: p.unite?.nom || "",
      pmp: pmpMap[p.id] ?? p.pmp,
      stock_theorique: stockMap[p.id] ?? p.stock_theorique,
    }));
    setProducts(final);
    setTotal(count || 0);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    return data || [];
  }, [mama_id]);

  async function addProduct(product, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { fournisseur_id, ...rest } = product || {};
    const payload = {
      ...rest,
      fournisseur_id: fournisseur_id ?? null,
      mama_id,
    };
    const { error } = await supabase.from("produits").insert([payload]);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
  }

  async function updateProduct(id, updateFields, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { fournisseur_id, ...rest } = updateFields || {};
    const payload = { ...rest };
    if (fournisseur_id !== undefined) {
      payload.fournisseur_id = fournisseur_id;
    }
    const { error } = await supabase
      .from("produits")
      .update(payload)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
  }

  async function duplicateProduct(id, { refresh = true } = {}) {
    const orig = products.find(p => p.id === id);
    if (!orig) return;
    const {
      sous_famille_id,
      unite_id,
      fournisseur_id,
      stock_reel,
      seuil_min,
      actif,
      code,
      allergenes,
      zone_stock_id,
    } = orig;
    const copy = {
      nom: `${orig.nom} (copie)`,
      sous_famille_id,
      unite_id,
      fournisseur_id,
      stock_reel,
      seuil_min,
      actif,
      code,
      allergenes,
      zone_stock_id,
    };
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("produits").insert([{ ...copy, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
  }

  async function toggleProductActive(id, actif, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("produits")
      .update({ actif })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
  }

  async function deleteProduct(id, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("produits")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    if (refresh) await fetchProducts();
  }

  const fetchProductPrices = useCallback(async (productId) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("fournisseur_produits")
      .select(
        "*, fournisseur:fournisseurs!fk_fournisseur_produits_fournisseur_id(id, nom), derniere_livraison:date_livraison"
      )
      .eq("produit_id", productId)
      .eq("mama_id", mama_id)
      .order("date_livraison", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    return data || [];
  }, [mama_id]);

  const getProduct = useCallback(
    async (id) => {
      if (!mama_id) return null;
      const { data, error } = await supabase
        .from("produits")
        .select(
          "*, famille:familles!fk_produits_famille(nom), sous_famille:sous_familles!fk_produits_sous_famille(nom), main_fournisseur:fournisseur_id(id, nom), unite:unites!fk_produits_unite(nom)"
        )
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      if (error) {
        setError(error);
        toast.error(error.message);
        return null;
      }
      return data;
    },
    [mama_id]
  );

  function exportProductsToExcel() {
    const datas = (products || []).map(p => ({
      id: p.id,
      nom: p.nom,
      famille: p.famille?.nom || "",
      unite: p.unite,
      code: p.code,
      allergenes: p.allergenes,
      pmp: p.pmp,
      stock_theorique: p.stock_theorique,
      stock_reel: p.stock_reel,
      seuil_min: p.seuil_min,
      dernier_prix: p.dernier_prix,
      fournisseur: p.main_fournisseur?.nom || "",
      fournisseur_id: p.fournisseur_id || "",
      actif: p.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Produits");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "produits_mamastock.xlsx");
  }

  async function importProductsFromExcel(file) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    try {
      const arr = await safeImportXLSX(file, "Produits");
      return arr;
    } catch (error) {
      setError(error);
      toast.error(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    products,
    total,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    duplicateProduct,
    toggleProductActive,
    deleteProduct,
    fetchProductPrices,
    getProduct,
    exportProductsToExcel,
    importProductsFromExcel,
  };
}

