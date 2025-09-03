// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useFournisseurs.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { safeImportXLSX } from '@/lib/xlsx/safeImportXLSX';
import { useQueryClient } from '@tanstack/react-query';

export function useFournisseurs() {
  const { mama_id } = useAuth();
  const queryClient = useQueryClient();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFournisseurs = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('fournisseurs')
      .select(
        'id, nom, actif, created_at, updated_at, contact:fournisseur_contacts!fournisseur_id(mama_id,nom,email,tel)'
      )
      .eq('mama_id', mama_id)
      .eq('contact.mama_id', mama_id)
      .order('nom');
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
      return [];
    }
    const list = [];
    if (Array.isArray(data)) {
      for (const f of data) {
        const contact = Array.isArray(f.contact) ? f.contact[0] : f.contact;
        list.push({ ...f, contact });
      }
    }
    setFournisseurs(list);
    return list;
  }, [mama_id]);

  useEffect(() => {
    if (!mama_id) return;
    void fetchFournisseurs();
  }, [mama_id, fetchFournisseurs]);

  // Ajouter un fournisseur
  async function createFournisseur(fournisseur) {
    if (!mama_id) return;
    const { nom, actif = true, tel, email, contact } = fournisseur;
    const { data, error } = await supabase
      .from('fournisseurs')
      .insert([{ nom, actif, mama_id }])
      .select('id, nom, actif, mama_id, created_at, updated_at')
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
    if (error) {
      toast.error(error.message);
    } else if (data) {
      setFournisseurs(prev =>
        Array.isArray(prev)
          ? prev.concat({ ...data, contact: { nom: contact, email, tel } }).sort((a, b) => a.nom.localeCompare(b.nom))
          : [{ ...data, contact: { nom: contact, email, tel } }]
      );
    }
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
    if (!error) {
      setFournisseurs(prev => {
        if (!Array.isArray(prev)) return [];
        const list = [];
        for (const f of prev) {
          if (f.id !== id) {
            list.push(f);
            continue;
          }
          const contactObj = { ...f.contact };
          if (contact !== undefined) contactObj.nom = contact;
          if (email !== undefined) contactObj.email = email;
          if (tel !== undefined) contactObj.tel = tel;
          list.push({ ...f, ...fields, contact: contactObj });
        }
        list.sort((a, b) => a.nom.localeCompare(b.nom));
        return list;
      });
    } else {
      toast.error(error.message);
    }
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
    if (error) {
      toast.error(error.message);
    } else {
      setFournisseurs(prev => {
        if (!Array.isArray(prev)) return [];
        const list = [];
        for (const f of prev) {
          list.push(f.id === id ? { ...f, actif } : f);
        }
        return list;
      });
    }
    queryClient.invalidateQueries({ queryKey: ['fournisseurs', mama_id] });
    queryClient.invalidateQueries({ queryKey: ['fournisseurs-autocomplete', mama_id] });
    return { error };
  }

  // Export Excel
  function exportFournisseursToExcel(fournisseurs = []) {
    const datas = [];
    if (Array.isArray(fournisseurs)) {
      for (const f of fournisseurs) {
        datas.push({
          id: f.id,
          nom: f.nom,
          tel: f.contact?.tel || '',
          contact: f.contact?.nom || '',
          email: f.contact?.email || '',
          actif: f.actif,
        });
      }
    }
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
    fournisseurs,
    loading,
    error,
    fetchFournisseurs,
    createFournisseur,
    updateFournisseur,
    toggleFournisseurActive,
    exportFournisseursToExcel,
    importFournisseursFromExcel,
  };
}

export default useFournisseurs;
