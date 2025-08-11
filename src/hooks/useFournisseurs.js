// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useFournisseurs.js
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import { safeImportXLSX } from "@/lib/xlsx/safeImportXLSX";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

export function useFournisseurs() {
  const { mama_id } = useAuth();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger les fournisseurs (filtrage par mama_id automatiquement)
  const fetchFournisseurs = useCallback(
    async ({ search = "", actif = null, page = 1, limit = 20 } = {}) => {
      if (loading || !mama_id) return [];
      setLoading(true);
      setError(null);
      let query = supabase
        .from("fournisseurs")
        .select(
          "id, nom, actif, created_at, updated_at, contact:fournisseur_contacts(nom,email,tel)",
          { count: "exact" }
        )
        .eq("mama_id", mama_id)
        .order("nom", { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      if (search) query = query.ilike("nom", `%${search}%`);
      if (typeof actif === "boolean") query = query.eq("actif", actif);

      const { data, error, count } = await query;
      const list = (Array.isArray(data) ? data : []).map(d => ({
        ...d,
        contact: Array.isArray(d.contact) ? d.contact[0] : d.contact,
      }));
      setFournisseurs(list);
      setTotal(count || 0);
      setLoading(false);
      if (error) {
        setError(error);
        toast.error(error.message);
      }
      return data || [];
    },
    [mama_id, loading]
  );

  // 2. Ajouter un fournisseur
  async function createFournisseur(fournisseur) {
    if (loading || !mama_id) return;
    setLoading(true);
    setError(null);
    const { nom, actif = true, tel, email, contact } = fournisseur;
    const { data, error } = await supabase
      .from("fournisseurs")
      .insert([{ nom, actif, mama_id }])
      .select()
      .single();
    if (!error && data && (tel || email || contact)) {
      await supabase.from("fournisseur_contacts").insert({
        fournisseur_id: data.id,
        mama_id,
        nom: contact,
        email,
        tel,
      });
    }
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    } else {
      await getFournisseurs();
    }
  }

  // 3. Modifier un fournisseur
  async function updateFournisseur(id, updateFields) {
    if (loading || !mama_id) return;
    setLoading(true);
    setError(null);
    const { tel, email, contact, ...fields } = updateFields;
    const { error } = await supabase
      .from("fournisseurs")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (!error && (tel || email || contact)) {
      await supabase
        .from("fournisseur_contacts")
        .upsert(
          [{ fournisseur_id: id, mama_id, nom: contact, email, tel }],
          { onConflict: ["fournisseur_id", "mama_id"] }
        );
    }
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    } else {
      await getFournisseurs();
    }
  }

  // 4. Désactiver un fournisseur (soft delete)
  async function disableFournisseur(id) {
    if (loading || !mama_id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("fournisseurs")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    } else {
      await getFournisseurs();
    }
  }

  // 5. Export Excel
  function exportFournisseursToExcel() {
    const datas = (fournisseurs || []).map(f => ({
      id: f.id,
      nom: f.nom,
      tel: f.contact?.tel || "",
      contact: f.contact?.nom || "",
      email: f.contact?.email || "",
      actif: f.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Fournisseurs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fournisseurs_mamastock.xlsx");
  }

  // 6. Import Excel
  async function importFournisseursFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const arr = await safeImportXLSX(file, "Fournisseurs");
      return arr;
    } catch (error) {
      setError(error);
      toast.error(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const getFournisseurs = fetchFournisseurs;

  return {
    fournisseurs,
    total,
    loading,
    error,
    fetchFournisseurs,
    getFournisseurs,
    createFournisseur,
    updateFournisseur,
    disableFournisseur,
    exportFournisseursToExcel,
    importFournisseursFromExcel,
  };
}

