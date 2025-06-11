import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useSupplierProducts() {
  const { mama_id } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger toutes les entrées fournisseur-produit (pour un produit, ou global)
  async function fetchSupplierProducts({ product_id = null, supplier_id = null } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("supplier_products")
      .select("*, product:products(id, nom), supplier:fournisseurs(id, nom)")
      .eq("mama_id", mama_id);
    if (product_id) query = query.eq("product_id", product_id);
    if (supplier_id) query = query.eq("supplier_id", supplier_id);

    const { data, error } = await query.order("updated_at", { ascending: false });
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter une relation produit-fournisseur (nouveau prix)
  async function addSupplierProduct(entry) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("supplier_products")
      .insert([{ ...entry, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchSupplierProducts({ product_id: entry.product_id });
  }

  // 3. Modifier une entrée
  async function updateSupplierProduct(id, updateFields) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("supplier_products")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    // Optionnel : refresh produit lié
  }

  // 4. Supprimer une entrée
  async function deleteSupplierProduct(id) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("supplier_products")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
  }

  // 5. Historique des prix pour un produit
  async function fetchHistory(product_id) {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("supplier_products")
      .select("*, supplier:fournisseurs(id, nom)")
      .eq("product_id", product_id)
      .eq("mama_id", mama_id)
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  return {
    entries,
    loading,
    error,
    fetchSupplierProducts,
    addSupplierProduct,
    updateSupplierProduct,
    deleteSupplierProduct,
    fetchHistory,
  };
}
