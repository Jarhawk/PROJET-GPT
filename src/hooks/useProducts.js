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

export function useProducts() {
  const { mama_id } = useAuth();
  const queryClient = useQueryClient();
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
      .from('produits')
      .select(
        `id, mama_id, nom, actif, famille_id, sous_famille_id, unite_id, zone_stock_id, pmp, stock_theorique, dernier_prix,
         unite:unites!fk_produits_unite(nom, mama_id),
         zone_stock:zones_stock!produits_zone_stock_id_fkey(nom, mama_id),
         famille:familles!fk_produits_famille(id, nom, mama_id),
         sous_famille:sous_familles!fk_produits_sous_famille(id, nom, mama_id)`,
        { count: 'exact' }
      )
      .eq('mama_id', mama_id)
      .eq('unite.mama_id', mama_id)
      .eq('zone_stock.mama_id', mama_id)
      .eq('famille.mama_id', mama_id)
      .eq('sous_famille.mama_id', mama_id);

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
      supabase
        .from('v_produits_dernier_prix')
        .select('produit_id, dernier_prix')
        .eq('mama_id', mama_id),
    ]);
    const pmpMap = {};
    const pmpArray = Array.isArray(pmpData) ? pmpData : [];
    for (const p of pmpArray) {
      pmpMap[p.produit_id] = p.pmp;
    }
    const stockMap = {};
    const stockArray = Array.isArray(stockData) ? stockData : [];
    for (const s of stockArray) {
      stockMap[s.produit_id] = s.stock;
    }
    const lastPriceMap = {};
    const lastPriceArray = Array.isArray(lastPriceData) ? lastPriceData : [];
    for (const l of lastPriceArray) {
      lastPriceMap[l.produit_id] = l.dernier_prix;
    }
    const final = [];
    const dataArray = Array.isArray(data) ? data : [];
    for (const p of dataArray) {
      final.push({
        ...p,
        pmp: pmpMap[p.id] ?? p.pmp,
        dernier_prix: lastPriceMap[p.id] ?? p.dernier_prix,
        stock_theorique: stockMap[p.id] ?? p.stock_theorique,
      });
    }
    setProducts(final);
    setTotal(count || 0);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    return Array.isArray(data) ? data : [];
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

  async function duplicateProduct(id, { refresh = true } = {}) {
    if (!mama_id) return { error: "Aucun mama_id" };
    let original;
    if (Array.isArray(products)) {
      for (const p of products) {
        if (p.id === id) {
          original = p;
          break;
        }
      }
    }
    if (!original) return { error: "Produit introuvable" };
    setLoading(true);
    setError(null);
    const {
      id: _id,
      pmp,
      stock_theorique,
      stock_reel,
      dernier_prix,
      unite,
      zone_stock,
      famille,
      sous_famille,
      main_fournisseur,
      ...rest
    } = original;
    const payload = { ...rest, nom: `${original.nom} (copie)`, mama_id };
    const { error } = await supabase.from('produits').insert([payload]);
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
      .from('fournisseur_produits')
      .select(
        'id, fournisseur_id, produit_id, prix_achat, mama_id, actif, derniere_livraison:date_livraison, fournisseur:fournisseurs!fk_fournisseur_produits_fournisseur_id(id, nom)'
      )
      .eq('produit_id', productId)
      .eq('mama_id', mama_id)
      .eq('fournisseur.mama_id', mama_id)
      .order('date_livraison', { ascending: false });
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    }
    return Array.isArray(data) ? data : [];
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
      const rows = Array.isArray(data) ? data : [];
      const out = [];
      for (const m of rows) {
        out.push({
          date: m.requisitions.date_requisition,
          type: 'sortie',
          quantite: m.quantite,
        });
      }
      return out;
    },
    [mama_id]
  );

  const getProduct = useCallback(
    async (id) => {
      if (!mama_id) return null;
      const { data, error } = await supabase
        .from("produits")
        .select(
          `id, nom, actif, famille_id, sous_famille_id, unite_id, zone_stock_id, code, image, allergenes, pmp, stock_reel, stock_min, stock_theorique, fournisseur_id, dernier_prix, fiche_technique_id, prix_vente, photo_url, url_photo, seuil_min, tva,
          famille:familles!fk_produits_famille(id, nom, mama_id),
          sous_famille:sous_familles!fk_produits_sous_famille(id, nom, mama_id),
          main_fournisseur:fournisseurs!fournisseur_id(id, nom, mama_id),
          unite:unites!fk_produits_unite(nom, mama_id)`
        )
        .eq("id", id)
        .eq("mama_id", mama_id)
        .eq("famille.mama_id", mama_id)
        .eq("sous_famille.mama_id", mama_id)
        .eq("unite.mama_id", mama_id)
        .eq("main_fournisseur.mama_id", mama_id)
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
    const datas = [];
    const productArray = Array.isArray(products) ? products : [];
    for (const p of productArray) {
      datas.push({
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
      });
    }
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
    duplicateProduct,
    fetchProductPrices,
    getProduct,
    exportProductsToExcel,
    importProductsFromExcel,
    fetchProductStock,
    fetchProductMouvements,
  };
}

