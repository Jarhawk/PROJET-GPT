// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useInventaires() {
  const { mama_id } = useAuth();
  const [inventaires, setInventaires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mama_id) return;
    void getInventaires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mama_id]);

  async function getInventaires({ includeArchives = false } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    let query = supabase
      .from('inventaires')
      .select(
        'id, date_inventaire, reference, zone, cloture, actif, created_at, updated_at, mama_id, lignes:inventaire_lignes(id, produit_id, quantite, quantite_reelle, quantite_theorique, zone_id, actif, produit:produits(id, nom, unite_id, pmp))'
      )
      .eq('mama_id', mama_id)
      .order('date_inventaire', { ascending: false });
    if (!includeArchives) query = query.eq('actif', true);
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      return [];
    }
    const cleaned = (Array.isArray(data) ? data : [])
      .filter(inv => inv.actif !== false)
      .map(inv => ({
        ...inv,
        lignes: Array.isArray(inv.lignes) ? inv.lignes.filter(l => l.actif !== false) : [],
      }));
    setInventaires(cleaned);
    return cleaned;
  }


  async function validateInventaireStock(inventaireId) {
    if (!mama_id || !inventaireId) return false;
    const inv = await getInventaireById(inventaireId);
    if (!inv) return false;
    for (const line of inv.lignes || []) {
      const { data, error } = await supabase
        .from("produits")
        .select("stock_reel")
        .eq("id", line.produit_id)
        .eq("mama_id", mama_id)
        .single();
      if (error || !data) return false;
      if (Number(data.stock_reel) !== Number(line.quantite_reelle)) return false;
    }
    return true;
  }

  async function createInventaire(inv = {}) {
    if (!mama_id) return null;
    const { lignes = [], date = new Date().toISOString().slice(0, 10), ...entete } = inv;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('inventaires')
      .insert([{ ...entete, date_inventaire: date, mama_id }])
      .select('id')
      .single();
    if (error) {
      setLoading(false);
      setError(error);
      return null;
    }
    if (lignes.length) {
      const toInsert = lignes.map(l => ({
        ...l,
        produit_id: l.produit_id,
        quantite_reelle: l.quantite_reelle,
        inventaire_id: data.id,
        mama_id,
      }));
      const { error: errLines } = await supabase.from('inventaire_lignes').insert(toInsert);
      if (errLines) setError(errLines);
    }
    setLoading(false);
    await getInventaires();
    return data;
  }

  async function getInventaireById(id) {
    if (!mama_id || !id) return null;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('inventaires')
      .select(
        'id, date_inventaire, reference, zone, cloture, actif, created_at, updated_at, mama_id, lignes:inventaire_lignes(id, produit_id, quantite, quantite_reelle, quantite_theorique, zone_id, actif, produit:produits(id, nom, unite_id, pmp))'
      )
      .eq('id', id)
      .eq('mama_id', mama_id)
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      return null;
    }
    const inv = data
      ? {
          ...data,
          lignes: Array.isArray(data.lignes) ? data.lignes.filter(l => l.actif !== false) : [],
        }
      : null;
    return inv;
  }

  async function deleteInventaire(id) {
    if (!mama_id || !id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("inventaires")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) setError(error);
    await getInventaires();
  }

  async function reactivateInventaire(id) {
    if (!mama_id || !id) return;
    const { error } = await supabase
      .from("inventaires")
      .update({ actif: true })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (!error) await getInventaires();
  }

  return {
    inventaires,
    loading,
    error,
    getInventaires,
    createInventaire,
    getInventaireById,
    deleteInventaire,
    reactivateInventaire,
    validateInventaireStock,
  };
}
