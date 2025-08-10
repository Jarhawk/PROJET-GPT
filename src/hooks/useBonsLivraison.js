// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

export function useBonsLivraison() {
  const { mama_id } = useAuth();
  const [bons, setBons] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getBonsLivraison({ fournisseur = "", debut = "", fin = "", actif = true, page = 1, pageSize = 50 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("bons_livraison")
      .select("id, numero_bl, date_reception, commentaire, actif, fournisseur_id, fournisseur:fournisseur_id(id, nom), lignes:lignes_bl!bl_id(id)", { count: "exact" })
      .eq("mama_id", mama_id)
      .order("date_reception", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (fournisseur) q = q.eq("fournisseur_id", fournisseur);
    if (actif !== null) q = q.eq("actif", actif);
    if (debut) q = q.gte("date_reception", debut);
    if (fin) q = q.lte("date_reception", fin);
    const { data, error, count } = await q;
    if (!error) {
      setBons(Array.isArray(data) ? data : []);
      setTotal(count || 0);
    }
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  async function fetchBonLivraisonById(id) {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase
      .from("bons_livraison")
      .select("id, numero_bl, date_reception, commentaire, actif, fournisseur_id, fournisseur:fournisseur_id(id, nom), lignes:lignes_bl!bl_id(id, bl_id, quantite_recue, prix_unitaire, tva, produit:produit_id(nom))")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setError(error);
      return null;
    }
    return data;
  }

  async function insertBonLivraison(bl) {
    if (!mama_id) return { error: "no mama_id" };
    const { lignes = [], ...header } = bl || {};
    setLoading(true);
    const { data, error } = await supabase
      .from("bons_livraison")
      .insert([{ ...header, mama_id }])
      .select("id")
      .single();
    if (!error && data?.id && lignes.length) {
      const rows = lignes.map(l => ({ ...l, bl_id: data.id, mama_id }));
      const { error: err2 } = await supabase.from("lignes_bl").insert(rows);
      if (err2) {
        setLoading(false);
        setError(err2);
        return { error: err2 };
      }
    }
    setLoading(false);
    if (error) {
      setError(error);
      return { error };
    }
    return { data };
  }

  async function updateBonLivraison(id, fields) {
    if (!mama_id) return { error: "no mama_id" };
    const { data, error } = await supabase
      .from("bons_livraison")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select()
      .single();
    if (error) {
      setError(error);
      return { error };
    }
    return { data };
  }

  async function toggleBonActif(id, actif) {
    return updateBonLivraison(id, { actif });
  }

  return {
    bons,
    total,
    loading,
    error,
    getBonsLivraison,
    fetchBonLivraisonById,
    insertBonLivraison,
    updateBonLivraison,
    toggleBonActif,
  };
}

export default useBonsLivraison;
