// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSPDF from "jspdf";
import "jspdf-autotable";

export function useFiches() {
  const { mama_id } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Liste paginée des fiches techniques
  async function getFiches({
    search = "",
    actif = null,
    famille = null,
    page = 1,
    limit = 20,
    sortBy = "nom",
    asc = true,
  } = {}) {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const sortField = ["nom", "cout_par_portion"].includes(sortBy) ? sortBy : "nom";
    let query = supabase
      .from("fiches_techniques")
      .select(
        "id, nom, actif, cout_par_portion, portions, famille, prix_vente, type_carte, sous_type_carte, carte_actuelle, cout_total, rendement, created_at, updated_at",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .order(sortField, { ascending: asc })
      .range((page - 1) * limit, page * limit - 1);

    if (search) query = query.ilike("nom", `%${search}%`);
    if (typeof actif === "boolean") query = query.eq("actif", actif);
    if (famille) query = query.eq("famille", famille);

    const { data, error, count } = await query;
    setLoading(false);
    if (error) {
      console.error('getFiches error:', error);
      setError(error);
      return [];
    }
    const rows = [];
    if (Array.isArray(data)) {
      for (const d of data) {
        rows.push({
          ...d,
          cout_par_portion: d.cout_par_portion ? Number(d.cout_par_portion) : null,
          cout_total: d.cout_total ? Number(d.cout_total) : null,
          portions: d.portions ? Number(d.portions) : null,
        });
      }
    }
    setFiches(rows);
    setTotal(count || 0);
    return rows;
  }

  // Récupération d'une fiche avec ses lignes + produits
  async function getFicheById(id) {
    if (!id || !mama_id) return null;
    setLoading(true);
    const { data, error } = await supabase
      .from("fiches_techniques")
      .select(
        "id, nom, actif, cout_par_portion, portions, famille, prix_vente, type_carte, sous_type_carte, carte_actuelle, cout_total, rendement, lignes:fiche_lignes(id, produit_id, sous_fiche_id, description, quantite, produit:produits(id, nom, pmp, dernier_prix, unite:unites(id, nom)), sous_fiche:fiches_techniques(id, nom, cout_par_portion))"
      )
      .eq("id", id)
      .eq("mama_id", mama_id)
      .eq("lignes.mama_id", mama_id)
      .eq("lignes.produit.mama_id", mama_id)
      .eq("lignes.produit.unite.mama_id", mama_id)
      .eq("lignes.sous_fiche.mama_id", mama_id)
      .single();
    setLoading(false);
    if (error) {
      console.error('getFicheById error:', error);
      setError(error);
      return null;
    }
    const lignesList = [];
    if (Array.isArray(data?.lignes)) {
      for (const l of data.lignes) {
        lignesList.push({
          id: l.id,
          produit_id: l.produit_id,
          sous_fiche_id: l.sous_fiche_id,
          description: l.description,
          quantite: l.quantite ? Number(l.quantite) : null,
          produit_nom: l.produit?.nom,
          unite_nom: l.produit?.unite?.nom,
          pmp: l.produit?.pmp ? Number(l.produit.pmp) : null,
          dernier_prix: l.produit?.dernier_prix ? Number(l.produit.dernier_prix) : null,
          sous_fiche: l.sous_fiche
            ? {
                id: l.sous_fiche.id,
                nom: l.sous_fiche.nom,
                cout_par_portion: l.sous_fiche.cout_par_portion
                  ? Number(l.sous_fiche.cout_par_portion)
                  : null,
              }
            : null,
        });
      }
    }
    const mapped = {
      ...data,
      cout_par_portion: data.cout_par_portion ? Number(data.cout_par_portion) : null,
      cout_total: data.cout_total ? Number(data.cout_total) : null,
      portions: data.portions ? Number(data.portions) : null,
      lignes: lignesList,
    };
    return mapped;
  }

  // Création fiche + lignes
  async function createFiche({ lignes = [], ...fiche }) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("fiches_techniques")
      .insert([{ ...fiche, mama_id }])
      .select("id")
      .single();
    if (insertError) {
      console.error('createFiche error:', insertError);
      setLoading(false);
      setError(insertError);
      return { error: insertError };
    }
    const ficheId = data?.id ?? data?.[0]?.id;
    if (Array.isArray(lignes) && lignes.length > 0) {
      const toInsert = [];
      for (const l of lignes) {
        toInsert.push({
          fiche_id: ficheId,
          produit_id: l.produit_id || null,
          sous_fiche_id: l.sous_fiche_id || null,
          quantite: l.quantite,
          mama_id,
        });
      }
      const { error: lignesError } = await supabase.from("fiche_lignes").insert(toInsert);
      if (lignesError) {
        console.error('createFiche lignes error:', lignesError);
        setLoading(false);
        setError(lignesError);
        return { error: lignesError };
      }
    }
    setFiches(prev => [{ id: ficheId, ...fiche }, ...prev]);
    setTotal(prev => prev + 1);
    setLoading(false);
    return { data: ficheId };
  }

  // Mise à jour fiche + lignes
  async function updateFiche(id, { lignes = [], ...fiche }) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("fiches_techniques")
      .update(fiche)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (updateError) {
      console.error('updateFiche error:', updateError);
      setLoading(false);
      setError(updateError);
      return { error: updateError };
    }
    const { error: deleteError } = await supabase
      .from("fiche_lignes")
      .delete()
      .eq("fiche_id", id)
      .eq("mama_id", mama_id);
    if (deleteError) {
      console.error('updateFiche delete lines error:', deleteError);
      setLoading(false);
      setError(deleteError);
      return { error: deleteError };
    }
    if (Array.isArray(lignes) && lignes.length > 0) {
      const toInsert = [];
      for (const l of lignes) {
        toInsert.push({
          fiche_id: id,
          produit_id: l.produit_id || null,
          sous_fiche_id: l.sous_fiche_id || null,
          quantite: l.quantite,
          mama_id,
        });
      }
      const { error: insertError } = await supabase.from("fiche_lignes").insert(toInsert);
      if (insertError) {
        console.error('updateFiche lines insert error:', insertError);
        setLoading(false);
        setError(insertError);
        return { error: insertError };
      }
    }
    setFiches(prev => {
      const arr = [];
      for (const f of prev) {
        arr.push(f.id === id ? { ...f, ...fiche } : f);
      }
      return arr;
    });
    setLoading(false);
    return { data: id };
  }

  // Désactivation logique
  async function deleteFiche(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { error: deleteError } = await supabase
      .from("fiches_techniques")
      .update({ actif: false })
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (deleteError) {
      console.error('deleteFiche error:', deleteError);
      setLoading(false);
      setError(deleteError);
      return { error: deleteError };
    }
    setFiches(prev => {
      const arr = [];
      for (const f of prev) {
        if (f.id !== id) arr.push(f);
      }
      return arr;
    });
    setTotal(prev => Math.max(prev - 1, 0));
    setLoading(false);
    return { data: id };
  }

  async function duplicateFiche(id) {
    if (!mama_id) return { error: "Aucun mama_id" };
    setLoading(true);
    setError(null);
    const { data: fiche, error: fetchError } = await supabase
      .from("fiches_techniques")
      .select("*, lignes:fiche_lignes!fiche_id(*)")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (fetchError) {
      console.error('duplicateFiche fetch error:', fetchError);
      setLoading(false);
      setError(fetchError);
      return { error: fetchError };
    }
    const { lignes = [], ...rest } = fiche || {};
    const { data: inserted, error: insertError } = await supabase
      .from("fiches_techniques")
      .insert([{ ...rest, nom: `${rest.nom} (copie)`, mama_id }])
      .select("id")
      .single();
    if (insertError) {
      console.error('duplicateFiche insert error:', insertError);
      setLoading(false);
      setError(insertError);
      return { error: insertError };
    }
    const newId = inserted.id;
    const lignesArr = Array.isArray(lignes) ? lignes : [];
    if (lignesArr.length) {
      const toInsert = [];
      for (const l of lignesArr) {
        toInsert.push({
          fiche_id: newId,
          produit_id: l.produit_id || null,
          sous_fiche_id: l.sous_fiche_id || null,
          quantite: l.quantite,
          mama_id,
        });
      }
      const { error: lineErr } = await supabase.from("fiche_lignes").insert(toInsert);
      if (lineErr) {
        console.error('duplicateFiche lines insert error:', lineErr);
        setLoading(false);
        setError(lineErr);
        return { error: lineErr };
      }
    }
    setFiches(prev => [...prev, { ...rest, id: newId, nom: `${rest.nom} (copie)` }]);
    setTotal(prev => prev + 1);
    setLoading(false);
    return { data: newId };
  }

  function exportFichesToExcel() {
    const datas = [];
    if (Array.isArray(fiches)) {
      for (const f of fiches) {
        datas.push({
          id: f.id,
          nom: f.nom,
          portions: f.portions,
          cout_total: f.cout_total,
          cout_par_portion: f.cout_par_portion,
          actif: f.actif,
        });
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Fiches");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fiches_mamastock.xlsx");
  }

  function exportFichesToPDF() {
    const doc = new JSPDF();
    const rows = [];
    if (Array.isArray(fiches)) {
      for (const f of fiches) {
        rows.push([f.nom, f.famille || "", f.portions, f.cout_par_portion]);
      }
    }
    doc.autoTable({ head: [["Nom", "Famille", "Portions", "Coût/portion"]], body: rows });
    doc.save("fiches_mamastock.pdf");
  }

  return { fiches, total, loading, error, getFiches, getFicheById, createFiche, updateFiche, deleteFiche, duplicateFiche, exportFichesToExcel, exportFichesToPDF };
}
