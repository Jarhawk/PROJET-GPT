import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Hook principal pour tout accès/fonction fournisseur
export function useSuppliers() {
  const { claims } = useAuth();
  const mama_id = claims?.mama_id;

  const [suppliers, setSuppliers] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  // Récupérer la liste (avec filtres, pagination)
  const fetchSuppliers = useCallback(
    async ({
      search = "",
      ville = "",
      actif = null,
      page = 1,
      pageSize = 20,
    } = {}) => {
      if (!mama_id) return;
      setLoading(true);
      let query = supabase
        .from("fournisseurs")
        .select("*", { count: "exact" })
        .eq("mama_id", mama_id);

      if (search) {
        query = query.ilike("nom", `%${search}%`);
      }
      if (ville) {
        query = query.ilike("ville", `%${ville}%`);
      }
      if (actif !== null) {
        query = query.eq("actif", !!actif);
      }
      query = query.order("nom", { ascending: true });
      query = query.range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;
      if (error) {
        setError(error.message);
        setSuppliers([]);
      } else {
        setSuppliers(data || []);
        setTotal(count || 0);
        setError("");
      }
      setLoading(false);
    },
    [mama_id]
  );

  // Récupérer un fournisseur par ID
  const fetchSupplierById = useCallback(
    async (id) => {
      if (!mama_id || !id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("fournisseurs")
        .select("*")
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();
      if (error) {
        setError(error.message);
        setSupplier(null);
      } else {
        setSupplier(data);
        setError("");
      }
      setLoading(false);
    },
    [mama_id]
  );

  // Ajouter un fournisseur
  const addSupplier = useCallback(
    async (supplierData) => {
      if (!mama_id) return { error: "Aucun mama_id" };
      setLoading(true);
      const { data, error } = await supabase
        .from("fournisseurs")
        .insert([{ ...supplierData, mama_id }])
        .select()
        .single();
      setLoading(false);
      if (error) return { error: error.message };
      return { data };
    },
    [mama_id]
  );

  // Modifier un fournisseur
  const updateSupplier = useCallback(
    async (id, supplierData) => {
      if (!mama_id || !id) return { error: "Aucun mama_id" };
      setLoading(true);
      const { data, error } = await supabase
        .from("fournisseurs")
        .update(supplierData)
        .eq("id", id)
        .eq("mama_id", mama_id)
        .select()
        .single();
      setLoading(false);
      if (error) return { error: error.message };
      return { data };
    },
    [mama_id]
  );

  // Activer/désactiver (soft delete)
  const toggleSupplierActive = useCallback(
    async (id, actif) => {
      return updateSupplier(id, { actif: !actif });
    },
    [updateSupplier]
  );

  // Suppression physique (si vraiment nécessaire, sinon à éviter)
  const deleteSupplier = useCallback(
    async (id) => {
      if (!mama_id || !id) return { error: "Aucun mama_id" };
      setLoading(true);
      const { error } = await supabase
        .from("fournisseurs")
        .delete()
        .eq("id", id)
        .eq("mama_id", mama_id);
      setLoading(false);
      if (error) return { error: error.message };
      return { success: true };
    },
    [mama_id]
  );

  return {
    suppliers,
    supplier,
    loading,
    total,
    error,
    fetchSuppliers,
    fetchSupplierById,
    addSupplier,
    updateSupplier,
    toggleSupplierActive,
    deleteSupplier,
  };
}
