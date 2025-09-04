// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState, useCallback } from "react";

import { useAuth } from '@/hooks/useAuth';
import usePeriodes from '@/hooks/usePeriodes';

export function useTransferts() {
  const { mama_id, user_id } = useAuth();
  const { checkCurrentPeriode } = usePeriodes();
  const [transferts, setTransferts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransferts = useCallback(
    async (
    {
      debut = "",
      fin = "",
      zone_source_id = "",
      zone_dest_id = "",
      produit_id = ""
    } = {}) =>
    {
      if (!mama_id) return [];
      setLoading(true);
      setError(null);
      let q = supabase.
      from("transferts").
      select(
        "id, date_transfert, motif, zone_source_id, zone_dest_id, zone_source:zones_stock!transferts_zone_source_id_fkey(id, nom), zone_dest:zones_stock!transferts_zone_dest_id_fkey(id, nom), lignes:transfert_lignes(id, produit_id, quantite, produit:produits(id, nom))"
      ).
      eq("mama_id", mama_id).
      order("date_transfert", { ascending: false });
      if (debut) q = q.gte("date_transfert", debut);
      if (fin) q = q.lte("date_transfert", fin);
      if (zone_source_id) q = q.eq("zone_source_id", zone_source_id);
      if (zone_dest_id) q = q.eq("zone_dest_id", zone_dest_id);
      if (produit_id) q = q.eq("transfert_lignes.produit_id", produit_id);
      const { data, error } = await q;
      setLoading(false);
      if (error) {
        setError(error);
        return [];
      }
      setTransferts(Array.isArray(data) ? data : []);
      return data || [];
    },
    [mama_id]
  );

  async function createTransfert(header, lignes = []) {
    if (!mama_id) return { error: "no mama_id" };
    const date = header.date_transfert || new Date().toISOString();
    const { error: pErr } = await checkCurrentPeriode(date);
    if (pErr) return { error: pErr };
    setLoading(true);
    setError(null);
    const { data: tr, error } = await supabase.
    from("transferts").
    insert([
    {
      mama_id,
      zone_source_id: header.zone_source_id,
      zone_dest_id: header.zone_dest_id,
      motif: header.motif || "",
      date_transfert: date,
      utilisateur_id: user_id
    }]
    ).
    select().
    single();
    if (error) {
      setError(error);
      setLoading(false);
      return { error };
    }
    const lignesInsert = lignes.map((l) => ({
      mama_id,
      transfert_id: tr.id,
      produit_id: l.produit_id,
      quantite: Number(l.quantite),
      commentaire: l.commentaire || ""
    }));
    const { error: err2 } = await supabase.
    from("transfert_lignes").
    insert(lignesInsert);
    if (err2) {
      setError(err2);
      setLoading(false);
      return { error: err2 };
    }
    setLoading(false);
    setTransferts((t) => [{ ...tr, lignes: lignesInsert }, ...t]);
    return { data: tr };
  }

  const getTransfertById = useCallback(
    async (id) => {
      if (!mama_id || !id) return null;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.
      from("transferts").
      select(
        "id, date_transfert, motif, zone_source_id, zone_dest_id, zone_source:zones_stock!transferts_zone_source_id_fkey(id, nom), zone_dest:zones_stock!transferts_zone_dest_id_fkey(id, nom), lignes:transfert_lignes(id, quantite, produit:produits(id, nom))"
      ).
      eq("mama_id", mama_id).
      eq("id", id).
      single();
      setLoading(false);
      if (error) {
        setError(error);
        return null;
      }
      return data;
    },
    [mama_id]
  );

  return {
    transferts,
    loading,
    error,
    fetchTransferts,
    createTransfert,
    getTransfertById
  };
}

export default useTransferts;