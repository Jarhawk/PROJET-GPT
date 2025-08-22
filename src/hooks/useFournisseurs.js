// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useFournisseurs.js
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { safeImportXLSX } from '@/lib/xlsx/safeImportXLSX';
import { getQueryClient } from '@/lib/react-query';

export function useFournisseurs() {
  const { mama_id } = useAuth();
  const queryClient = getQueryClient();

  // Ajouter un fournisseur
  async function createFournisseur(fournisseur) {
    if (!mama_id) return;
    const { nom, actif = true, tel, email, contact } = fournisseur;
    const { data, error } = await supabase
      .from('fournisseurs')
      .insert([{ nom, actif, mama_id }])
      .select()
      .single();
    if (!error && data && (tel || email || contact)) {
      await supabase.from('fournisseur_contacts').insert({
        fournisseur_id: data.id,
        mama_id,
        nom: contact,
        email,
        tel,
      });
    }
    if (error) toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ['fournisseurs', mama_id] });
    queryClient.invalidateQueries({ queryKey: ['fournisseurs-autocomplete', mama_id] });
    return { data, error };
  }

  // Modifier un fournisseur
  async function updateFournisseur(id, updateFields) {
    if (!mama_id) return;
    const { tel, email, contact, ...fields } = updateFields;
    const { error } = await supabase
      .from('fournisseurs')
      .update(fields)
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (!error && (tel || email || contact)) {
      await supabase
        .from('fournisseur_contacts')
        .upsert(
          [{ fournisseur_id: id, mama_id, nom: contact, email, tel }],
          { onConflict: ['fournisseur_id', 'mama_id'] }
        );
    }
    if (error) toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ['fournisseurs', mama_id] });
    queryClient.invalidateQueries({ queryKey: ['fournisseurs-autocomplete', mama_id] });
    return { error };
  }

  // Activer/désactiver un fournisseur
  async function toggleFournisseurActive(id, actif) {
    if (!mama_id) return;
    const { error } = await supabase
      .from('fournisseurs')
      .update({ actif })
      .eq('id', id)
      .eq('mama_id', mama_id);
    if (error) toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ['fournisseurs', mama_id] });
    queryClient.invalidateQueries({ queryKey: ['fournisseurs-autocomplete', mama_id] });
    return { error };
  }

  // Export Excel
  function exportFournisseursToExcel(fournisseurs = []) {
    const datas = (fournisseurs || []).map(f => ({
      id: f.id,
      nom: f.nom,
      tel: f.contact?.tel || '',
      contact: f.contact?.nom || '',
      email: f.contact?.email || '',
      actif: f.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), 'Fournisseurs');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'fournisseurs_mamastock.xlsx');
  }

  // Import Excel
  async function importFournisseursFromExcel(file) {
    try {
      const arr = await safeImportXLSX(file, 'Fournisseurs');
      return arr;
    } catch (error) {
      toast.error(error.message);
      return [];
    }
  }

  return {
    createFournisseur,
    updateFournisseur,
    toggleFournisseurActive,
    exportFournisseursToExcel,
    importFournisseursFromExcel,
  };
}

export default useFournisseurs;
