// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";

export function useMouvementsStock() {
  const { mama_id, user_id } = useAuth();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les mouvements (filtre, type, période, produit)
  async function fetchMouvements({ type = "", produit = "", zone_source = "", zone_destination = "", date_debut = "", date_fin = "" } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("stock_mouvements")
      .select("*")
      .eq("mama_id", mama_id);

    if (type) query = query.eq("type", type);
    if (produit) query = query.eq("produit_id", produit);
    if (zone_source) query = query.eq("zone_source_id", zone_source);
    if (zone_destination) query = query.eq("zone_destination_id", zone_destination);
    if (date_debut) query = query.gte("date", date_debut);
    if (date_fin) query = query.lte("date", date_fin);


    const { data, error } = await query.order("date", { ascending: false });
    setMouvements(Array.isArray(data) ? data : []);
    setLoading(false);
    if (error) setError(error);
    return data || [];
  }

  // 2. Ajouter un mouvement (entrée/sortie/correction)
  async function addMouvement(mouvement) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("stock_mouvements")
      .insert([{ ...mouvement, mama_id, auteur_id: user_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchMouvements();
  }

  // 3. Modifier un mouvement
  async function updateMouvement(id, updateFields) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("stock_mouvements")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchMouvements();
  }

  // 4. Supprimer un mouvement
  async function deleteMouvement(id) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("stock_mouvements")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchMouvements();
  }

  // 5. Batch suppression
  async function batchDeleteMouvements(ids = []) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("stock_mouvements")
      .delete()
      .in("id", ids)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchMouvements();
  }

  // 6. Export Excel
  function exportMouvementsToExcel() {
    const datas = (mouvements || []).map(m => ({
      id: m.id,
      date: m.date,
      type: m.type,
      produit_id: m.produit_id,
      quantite: m.quantite,
      zone_source_id: m.zone_source_id,
      zone_destination_id: m.zone_destination_id,
      commentaire: m.commentaire,
      mama_id: m.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Mouvements");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "stock_mouvements_mamastock.xlsx");
  }

  // 7. Import Excel (lecture, insertion à valider manuellement)
  async function importMouvementsFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const arr = await safeImportXLSX(file, "Mouvements");
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    mouvements,
    loading,
    error,
    fetchMouvements,
    addMouvement,
    updateMouvement,
    deleteMouvement,
    batchDeleteMouvements,
    exportMouvementsToExcel,
    importMouvementsFromExcel,
  };
}
