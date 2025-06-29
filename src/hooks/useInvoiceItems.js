// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Hook managing invoice line items (facture_lignes)
export function useInvoiceItems() {
  const { mama_id } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all items linked to a given invoice
  async function fetchItemsByInvoice(invoiceId) {
    if (!invoiceId || !mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("facture_lignes")
      .select("*, produit: produits(nom, famille, unite)")
      .eq("facture_id", invoiceId)
      .eq("mama_id", mama_id)
      .order("id");
    setItems(data || []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // Retrieve a single item by primary key
  async function fetchItemById(id) {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase
      .from("facture_lignes")
      .select("*, produit: produits(nom, famille, unite)")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setError(error);
      return null;
    }
    return data;
  }

  // Insert a new item attached to an invoice
  async function addItem(invoiceId, item) {
    if (!invoiceId || !mama_id) return { error: "no mama_id" };
    const { produit_id, ...rest } = item || {};
    const payload = {
      ...rest,
      produit_id,
      facture_id: invoiceId,
      mama_id,
    };
    const { data, error } = await supabase
      .from("facture_lignes")
      .insert([payload]);
    if (error) setError(error);
    return { data, error };
  }

  // Update item by id
  async function updateItem(id, fields) {
    if (!id || !mama_id) return { error: "no mama_id" };
    const { produit_id, ...rest } = fields || {};
    const payload = {
      ...rest,
      ...(produit_id !== undefined && { produit_id }),
    };
    const { data, error } = await supabase
      .from("facture_lignes")
      .update(payload)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    return { data, error };
  }

  // Delete item by id
  async function deleteItem(id) {
    if (!id || !mama_id) return { error: "no mama_id" };
    const { error } = await supabase
      .from("facture_lignes")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .delete();
    if (error) setError(error);
    return { error };
  }

  return {
    items,
    loading,
    error,
    fetchItemsByInvoice,
    fetchItemById,
    addItem,
    updateItem,
    deleteItem,
  };
}
