// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useProducts.js
import { useState, useCallback, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

function safeQueryClient() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryClient();
  } catch {
    return {
      invalidateQueries: () => {},
      setQueryData: () => {},
      fetchQuery: async () => {},
    };
  }
}

export function useProducts() {
  const { mama_id } = useAuth();
  const queryClient = safeQueryClient();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async ({
    search = "",
    famille = "",
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
        `*, unite:unite_id (nom), zone_stock:zones_stock(nom), famille:familles(nom), sous_famille:sous_familles(nom)`,
        { count: "exact" }
      )
      .eq("mama_id", mama_id);

    if (search) {
      query = query.ilike("nom", `%${search}%`);
    }
    if (famille) query = query.eq("famille_id", famille);
    if (sousFamille) query = query.eq("sous_famille_id", sousFamille);
    if (zone) query = query.eq("zone_stock_id", zone);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    if (sortBy === "nom") {
      query = query.order("nom", { ascending: order === "asc" });
    } else {
      query = query.order(sortBy, { ascending: order === "asc" })
                   .order("nom", { ascending: order === "asc" });
    }
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    const [
      { data: pmpData },
      { data: stockData },
      { data: lastPriceData },
    ] = await Promise.all([
      supabase.from('v_pmp').select('produit_id, pmp').eq('mama_id', mama_id),
      supabase.from('v_stocks').select('produit_id, stock').eq('mama_id', mama_id),
      supabase.from('v_products_last_price').select('produit_id, dernier_prix').eq('mama_id', mama_id),
    ]);
    const pmpMap = Object.fromEntries((pmpData || []).map(p => [p.produit_id, p.pmp]));
    const stockMap = Object.fromEntries((stockData || []).map(s => [s.produit_id, s.stock]));
    const lastPriceMap = Object.fromEntries((lastPriceData || []).map(l => [l.produit_id, l.dernier_prix]));
    const final = (Array.isArray(data) ? data : []).map((p) => ({
      ...p,
      pmp: pmpMap[p.id] ?? p.pmp,
      dernier_prix: lastPriceMap[p.id] ?? p.dernier_prix,
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

  useEffect(() => {
    if (!mama_id) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mama_id]);

  async function addProduct(product, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { fournisseur_id, tva, ...rest } = product || {};
    const payload = {
      ...rest,
      tva: tva ?? 0,
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
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
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
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
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
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
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
    queryClient.invalidateQueries({ queryKey: ['product-search', mama_id] });
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

  const fetchProductStock = useCallback(
    async (productId) => {
      if (!mama_id) return null;
      const { data, error } = await supabase
        .from('v_stocks')
        .select('stock')
        .eq('produit_id', productId)
        .eq('mama_id', mama_id)
        .single();
      if (error) {
        setError(error);
        toast.error(error.message);
        return null;
      }
      return data?.stock ?? 0;
    },
    [mama_id]
  );

  const fetchProductMouvements = useCallback(
    async (productId) => {
      if (!mama_id) return [];
      const { data, error } = await supabase
        .from('requisition_lignes')
        .select('quantite, requisitions!inner(date_requisition, mama_id, statut)')
        .eq('produit_id', productId)
        .eq('requisitions.mama_id', mama_id)
        .eq('requisitions.statut', 'réalisée')
        .order('requisitions.date_requisition', { ascending: false });
      if (error) {
        setError(error);
        toast.error(error.message);
        return [];
      }
      return (data || []).map(m => ({
        date: m.requisitions.date_requisition,
        type: 'sortie',
        quantite: m.quantite,
      }));
    },
    [mama_id]
  );

  const getProduct = useCallback(
    async (id) => {
      if (!mama_id) return null;
      const { data, error } = await supabase
        .from("produits")
        .select(
          "*, famille:familles!fk_produits_famille(nom), sous_famille:sous_familles!fk_produits_sous_famille(nom), main_fournisseur:fournisseur_id(id, nom), unite:unite_id (nom)"
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
      unite: p.unite?.nom || "",
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
    toggleProductActive,
    deleteProduct,
    fetchProductPrices,
    getProduct,
    exportProductsToExcel,
    importProductsFromExcel,
    fetchProductStock,
    fetchProductMouvements,
  };
}

