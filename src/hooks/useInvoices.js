import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function useInvoices() {
  const { mama_id } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Charger toutes les factures (avec fournisseur, filtrage)
  async function fetchInvoices({ search = "", fournisseur = "", statut = "", date = "" } = {}) {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("factures")
      .select(`
        *,
        fournisseur: fournisseurs (id, nom)
      `)
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (search) query = query.ilike("reference", `%${search}%`);
    if (fournisseur) query = query.eq("fournisseur_id", fournisseur);
    if (statut) query = query.eq("statut", statut);
    if (date) query = query.eq("date", date);

    const { data, error } = await query;
    setInvoices(data || []);
    setLoading(false);
    if (error) setError(error);
    return data;
  }

  // 2. Ajouter une facture
  async function addInvoice(invoice) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("factures")
      .insert([{ ...invoice, mama_id }]);
    if (error) setError(error);
    setLoading(false);
    await fetchInvoices();
  }

  // 3. Modifier une facture
  async function updateInvoice(id, updateFields) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("factures")
      .update(updateFields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchInvoices();
  }

  // 4. Supprimer une facture
  async function deleteInvoice(id) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("factures")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchInvoices();
  }

  // 5. Batch statut
  async function batchUpdateStatus(ids = [], statut) {
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("factures")
      .update({ statut })
      .in("id", ids)
      .eq("mama_id", mama_id);
    if (error) setError(error);
    setLoading(false);
    await fetchInvoices();
  }

  // 6. Export Excel
  function exportInvoicesToExcel() {
    const datas = (invoices || []).map(f => ({
      id: f.id,
      reference: f.reference,
      date: f.date,
      fournisseur: f.fournisseur?.nom,
      montant: f.montant,
      statut: f.statut,
      mama_id: f.mama_id,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Factures");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "factures_mamastock.xlsx");
  }

  // 7. Import Excel
  async function importInvoicesFromExcel(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const arr = XLSX.utils.sheet_to_json(workbook.Sheets["Factures"]);
      return arr;
    } catch (error) {
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    batchUpdateStatus,
    exportInvoicesToExcel,
    importInvoicesFromExcel,
  };
}
