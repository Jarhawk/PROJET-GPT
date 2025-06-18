import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useInventaires() {
  const { mama_id } = useAuth();
  const [inventaires, setInventaires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mouvements, setMouvements] = useState([]);

  // 1. Charger tous les inventaires (avec lignes)
  async function fetchInventaires({ search = "", date = "", actif = null } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("inventaires")
      .select("*, lignes:inventaire_lignes(*), cloture")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (search) query = query.ilike("reference", `%${search}%`);
    if (date) query = query.eq("date", date);
    if (typeof actif === "boolean") query = query.eq("actif", actif);

    const { data, error } = await query;
    setInventaires(data || []);
    setLoading(false);
    if (error) setError(error);
    return data;
  }

  // 2. Ajouter un inventaire (avec lignes)
  async function addInventaire(inv) {
    setLoading(true);
    setError(null);
    const { lignes, ...entete } = inv;
    const { data, error } = await supabase
      .from("inventaires")
      .insert([{ ...entete, mama_id }])
      .select("id")
      .single();

    if (error) { setError(error); setLoading(false); return; }
    if (data?.id && Array.isArray(lignes) && lignes.length > 0) {
      const lignesWithFk = lignes.map(l => ({
        ...l,
        inventaire_id: data.id,
        mama_id,
      }));
      const { error: errorLignes } = await supabase
        .from("inventaire_lignes")
        .insert(lignesWithFk);
      if (errorLignes) { setError(errorLignes); }
    }
    setLoading(false);
    await fetchInventaires();
    return data;
  }

  // 3. Modifier un inventaire (maj entête + lignes)
  async function editInventaire(id, inv) {
    setLoading(true);
    setError(null);
    const { lignes, ...entete } = inv;
    const { error: errorInv } = await supabase
      .from("inventaires")
      .update(entete)
      .eq("id", id);

    // Suppression puis réinsertion des lignes
    if (Array.isArray(lignes)) {
      await supabase.from("inventaire_lignes").delete().eq("inventaire_id", id);
      const lignesWithFk = lignes.map(l => ({
        ...l,
        inventaire_id: id,
        mama_id,
      }));
      if (lignesWithFk.length > 0) {
        await supabase.from("inventaire_lignes").insert(lignesWithFk);
      }
    }
    setLoading(false);
    if (errorInv) setError(errorInv);
    await fetchInventaires();
  }

  // 4. Supprimer un inventaire (et ses lignes)
  async function deleteInventaire(id) {
    setLoading(true);
    setError(null);
    await supabase.from("inventaire_lignes").delete().eq("inventaire_id", id);
    const { error } = await supabase.from("inventaires").delete().eq("id", id);
    setLoading(false);
    if (error) setError(error);
    await fetchInventaires();
  }

  // 5. Clôturer un inventaire
  async function clotureInventaire(id) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("inventaires")
      .update({ cloture: true })
      .eq("id", id);
    setLoading(false);
    if (error) setError(error);
    await fetchInventaires();
  }

  // 6. Réinitialiser un inventaire (reset lignes à 0)
  async function resetInventaire(id) {
    setLoading(true);
    setError(null);
    // Set all lignes quantité to 0
    const { data: lignes } = await supabase
      .from("inventaire_lignes")
      .select("*")
      .eq("inventaire_id", id);
    if (lignes && lignes.length) {
      for (const l of lignes) {
        await supabase.from("inventaire_lignes").update({ quantite: 0 }).eq("id", l.id);
      }
    }
    setLoading(false);
    await fetchInventaires();
  }

  // 7. Charger mouvements stock sur période
  async function fetchMouvementsForPeriod(date_debut, date_fin) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("mouvements_stock")
      .select("*")
      .gte("date", date_debut)
      .lte("date", date_fin)
      .eq("mama_id", mama_id);

    const { data, error } = await query;
    setMouvements(data || []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 8. Charger mouvements liés à un inventaire précis
  async function fetchMouvementsInventaire(inventaire_id) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("mouvements_stock")
      .select("*")
      .eq("inventaire_id", inventaire_id)
      .eq("mama_id", mama_id);

    const { data, error } = await query;
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 9. Récupérer le dernier inventaire clôturé
  async function fetchLastClosedInventaire(beforeDate = null) {
    let query = supabase
      .from("inventaires")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("cloture", true)
      .order("date", { ascending: false })
      .limit(1);
    if (beforeDate) query = query.lt("date", beforeDate);
    const { data } = await query.single();
    return data;
  }

  // 10. Export Excel
  function exportInventairesToExcel() {
    const datas = (inventaires || []).map(i => ({
      id: i.id,
      date: i.date,
      cloture: i.cloture,
      lignes: Array.isArray(i.lignes) ? i.lignes.length : 0,
      zone_id: i.zone_id,
      mama_id: i.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Inventaires");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "inventaires_mamastock.xlsx");
  }

  return {
    inventaires,
    mouvements,
    loading,
    error,
    fetchInventaires,
    addInventaire,
    editInventaire,
    deleteInventaire,
    clotureInventaire,
    resetInventaire,
    fetchMouvementsForPeriod,
    fetchMouvementsInventaire,
    fetchLastClosedInventaire,
    exportInventairesToExcel,
  };
}
