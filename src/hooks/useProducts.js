// src/hooks/useProducts.js
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
        .from("v_products_last_price")
        .select(
          "*, fournisseurs:supplier_products(*, fournisseur: fournisseurs(nom)), main_supplier: fournisseurs!products_main_supplier_id_fkey(id, nom)",
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
    if (error) setError(error);
    return data || [];
  }, [mama_id]);

  async function addProduct(product) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("products").insert([{ ...product, mama_id }]);
    setLoading(false);
    if (error) setError(error);
    await fetchProducts();
  }

  async function updateProduct(id, updateFields) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("products")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
    await fetchProducts();
  }

  async function duplicateProduct(id) {
    const orig = products.find(p => p.id === id);
    if (!orig) return;
    const copy = { ...orig, nom: `${orig.nom} (copie)` };
    delete copy.id;
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("products").insert([{ ...copy, mama_id }]);
    setLoading(false);
    if (error) setError(error);
    await fetchProducts();
  }

  async function toggleProductActive(id, actif) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("products")
      .update({ actif })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
    await fetchProducts();
  }

  async function deleteProduct(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("products")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
    await fetchProducts();
  }

  async function fetchProductPrices(productId) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("supplier_products")
      .select(
        "*, fournisseur: fournisseurs(id, nom), derniere_livraison:date_livraison"
      )
      .eq("product_id", productId)
      .eq("mama_id", mama_id)
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) setError(error);
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
