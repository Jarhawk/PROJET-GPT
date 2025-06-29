// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useProducts.js
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
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
    famille = "",
    actif = null,
    page = 1,
    limit = 100,
    sortBy = "famille",
    order = "asc",
  } = {}) => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
      let query = supabase
        .from("v_produits_dernier_prix")
        .select(
          "*, fournisseurs:fournisseur_produits(*, fournisseur: fournisseurs(nom)), main_supplier: fournisseurs!produits_fournisseur_principal_id_fkey(id, nom)",
          { count: "exact" }
        )
      .eq("mama_id", mama_id)
      .order(sortBy, { ascending: order === "asc" })
      .order("nom", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (search) query = query.ilike("nom", `%${search}%`);
    if (famille) query = query.ilike("famille", `%${famille}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error, count } = await query;
    setProducts(Array.isArray(data) ? data : []);
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
    const {
      main_supplier_id,
      ...rest
    } = product || {};
    const payload = {
      ...rest,
      fournisseur_principal_id: main_supplier_id || null,
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
    const { main_supplier_id, ...rest } = updateFields || {};
    const payload = {
      ...rest,
      ...(main_supplier_id !== undefined && {
        fournisseur_principal_id: main_supplier_id,
      }),
    };
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
      famille,
      unite,
      main_supplier_id,
      stock_reel,
      stock_min,
      actif,
      code,
      allergenes,
      image,
    } = orig;
    const copy = {
      nom: `${orig.nom} (copie)`,
      famille,
      unite,
      fournisseur_principal_id: main_supplier_id,
      stock_reel,
      stock_min,
      actif,
      code,
      allergenes,
      image,
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

  async function fetchProductPrices(productId) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("fournisseur_produits")
      .select(
        "*, fournisseur: fournisseurs(id, nom), derniere_livraison:date_livraison"
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
  }

  function exportProductsToExcel() {
    const datas = (products || []).map(p => ({
      id: p.id,
      nom: p.nom,
      famille: p.famille,
      unite: p.unite,
      code: p.code,
      allergenes: p.allergenes,
      image: p.image,
      pmp: p.pmp,
      stock_reel: p.stock_reel,
      stock_min: p.stock_min,
      actif: p.actif,
      mama_id: p.mama_id,
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet =
        workbook.Sheets["Produits"] || workbook.Sheets[workbook.SheetNames[0]];
      const arr = XLSX.utils.sheet_to_json(sheet);
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
    exportProductsToExcel,
    importProductsFromExcel,
  };
}

