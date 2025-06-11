import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useProducts() {
  const { mama_id } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger tous les produits (filtrage multi critères)
  async function fetchProducts({ search = "", famille = "", actif = null } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("products")
      .select("*, fournisseurs:supplier_products(fournisseur_id, prix_achat, derniere_livraison), main_supplier:suppliers(id, nom)")
      .eq("mama_id", mama_id)
      .order("famille", { ascending: true })
      .order("nom", { ascending: true });

    if (search) query = query.ilike("nom", `%${search}%`);
    if (famille) query = query.ilike("famille", `%${famille}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error } = await query;
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un produit
  async function addProduct(product) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("products")
      .insert([{ ...product, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchProducts();
  }

  // 3. Modifier un produit
  async function updateProduct(id, updateFields) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("products")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchProducts();
  }

  // 4. Désactiver/réactiver un produit
  async function toggleProductActive(id, actif) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("products")
      .update({ actif })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchProducts();
  }

  // 5. Supprimer un produit
  async function deleteProduct(id) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchProducts();
  }

  // 6. Historique des prix par fournisseur pour un produit
  async function fetchProductPrices(productId) {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("supplier_products")
      .select("*, supplier: suppliers(id, nom)")
      .eq("product_id", productId)
      .eq("mama_id", mama_id)
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 7. Export Excel
  function exportProductsToExcel() {
    const datas = (products || []).map(p => ({
      id: p.id,
      nom: p.nom,
      famille: p.famille,
      unite: p.unite,
      pmp: p.pmp,
      stock_reel: p.stock_reel,
      actif: p.actif,
      mama_id: p.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Produits");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "produits_mamastock.xlsx");
  }

  // 8. Import Excel
  async function importProductsFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Produits"]);
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
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    toggleProductActive,
    deleteProduct,
    fetchProductPrices,
    exportProductsToExcel,
    importProductsFromExcel,
  };
}
