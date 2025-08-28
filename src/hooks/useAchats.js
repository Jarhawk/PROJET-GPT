// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useAchats() {
  const { mama_id } = useAuth();
  const [achats, setAchats] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getAchats({ fournisseur = "", produit = "", debut = "", fin = "", actif = true, page = 1, pageSize = 50 } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let q = supabase
      .from("achats")
      .select(
        "id, mama_id, produit_id, prix, quantite, date_achat, created_at, updated_at, actif, fournisseur_id, fournisseur:fournisseur_id(id, nom, mama_id), produit:produit_id(id, nom, mama_id)",
        { count: "exact" },
      )
      .eq("mama_id", mama_id)
      .eq("fournisseur.mama_id", mama_id)
      .eq("produit.mama_id", mama_id)
      .order("date_achat", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (fournisseur) q = q.eq("fournisseur_id", fournisseur);
    if (produit) q = q.eq("produit_id", produit);
    if (actif !== null) q = q.eq("actif", actif);
    if (debut) q = q.gte("date_achat", debut);
    if (fin) q = q.lte("date_achat", fin);
    const { data, error, count } = await q;
    if (!error) {
      setAchats(Array.isArray(data) ? data : []);
      setTotal(count || 0);
    }
    setLoading(false);
    if (error) setError(error);
    return Array.isArray(data) ? data : [];
  }

  async function fetchAchatById(id) {
    if (!id || !mama_id) return null;
    const { data, error } = await supabase
      .from("achats")
      .select("id, mama_id, produit_id, prix, quantite, date_achat, created_at, updated_at, actif, fournisseur_id, fournisseur:fournisseur_id(id, nom, mama_id), produit:produit_id(id, nom, mama_id)")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .eq("fournisseur.mama_id", mama_id)
      .eq("produit.mama_id", mama_id)
      .single();
    if (error) { setError(error); return null; }
    return data;
  }

  async function createAchat(achat) {
    if (!mama_id) return { error: "no mama_id" };
    const { data, error } = await supabase
      .from("achats")
      .insert([{ ...achat, mama_id }])
      .select("id, mama_id, produit_id, prix, quantite, date_achat, created_at, updated_at, actif, fournisseur_id")
      .single();
    if (error) {
      setError(error);
      return { error };
    }
    setAchats((a) => {
      const list = Array.isArray(a) ? a : [];
      return [data, ...list];
    });
    return { data };
  }

  async function updateAchat(id, fields) {
    if (!mama_id) return { error: "no mama_id" };
    const { data, error } = await supabase
      .from("achats")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id)
      .select("id, mama_id, produit_id, prix, quantite, date_achat, created_at, updated_at, actif, fournisseur_id")
      .single();
    if (error) {
      setError(error);
      return { error };
    }
    setAchats((a) => {
      const list = Array.isArray(a) ? a : [];
      return list.map((ac) => (ac.id === id ? data : ac));
    });
    return { data };
  }

  async function deleteAchat(id) {
    if (!mama_id) return { error: "no mama_id" };
    const { error } = await supabase
      .from("achats")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) {
      setError(error);
      return { error };
    }
    setAchats((a) => {
      const list = Array.isArray(a) ? a : [];
      return list.map((ac) => (ac.id === id ? { ...ac, actif: false } : ac));
    });
    return { success: true };
  }

  return { achats, total, loading, error, getAchats, fetchAchatById, createAchat, updateAchat, deleteAchat };
}

export default useAchats;
