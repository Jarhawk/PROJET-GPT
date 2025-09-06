// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/hooks/useFournisseurs.js
import { useState, useEffect, useCallback } from "react";

import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { safeImportXLSX } from '@/lib/xlsx/safeImportXLSX';
import { useQueryClient } from '@tanstack/react-query';
import {
  fournisseurs_list,
  fournisseurs_create,
  fournisseurs_update,
} from '@/lib/db'

function safeQueryClient() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryClient();
  } catch {
    return {
      invalidateQueries: () => {},
      setQueryData: () => {},
      setQueriesData: () => {},
      fetchQuery: async () => {}
    };
  }
}

export function useFournisseurs() {
  const { mama_id } = useAuth();
  const queryClient = safeQueryClient();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFournisseurs = useCallback(async () => {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await fournisseurs_list({ mama_id });
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
      return [];
    }
    setFournisseurs(Array.isArray(data) ? data : []);
    return data || [];
  }, [mama_id]);

  useEffect(() => {
    if (!mama_id) return;
    void fetchFournisseurs();
  }, [mama_id, fetchFournisseurs]);

  // Ajouter un fournisseur
  async function createFournisseur(fournisseur) {
    if (!mama_id) return;
    const { nom, actif = true, tel, email, contact } = fournisseur;
    const { data, error } = await fournisseurs_create({ nom, actif, mama_id, contact, email, tel });
    if (error) {
      toast.error(error.message);
    } else if (data) {
      setFournisseurs((prev) => [...prev, { ...data, contact: { nom: contact, email, tel } }].sort((a, b) => a.nom.localeCompare(b.nom)));
    }
    queryClient.invalidateQueries({ queryKey: ['fournisseurs', mama_id] });
    queryClient.invalidateQueries({ queryKey: ['fournisseurs-autocomplete', mama_id] });
    return { data, error };
  }

  // Modifier un fournisseur
  async function updateFournisseur(id, updateFields) {
    if (!mama_id) return;
    const { tel, email, contact, ...fields } = updateFields;
    const { error } = await fournisseurs_update(id, mama_id, { ...fields, contact, email, tel });
    if (!error) {
      setFournisseurs((prev) =>
      prev.
      map((f) => {
        if (f.id !== id) return f;
        const contactObj = f.contact ? { ...f.contact } : {};
        if (contact !== undefined) contactObj.nom = contact;
        if (email !== undefined) contactObj.email = email;
        if (tel !== undefined) contactObj.tel = tel;
        return {
          ...f,
          ...fields,
          contact: Object.keys(contactObj).length ? contactObj : null,
        };
      }).
      sort((a, b) => a.nom.localeCompare(b.nom))
      );
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
    const { error } = await fournisseurs_update(id, mama_id, { actif });
    if (error) {
      toast.error(error.message);
    } else {
      setFournisseurs((prev) => prev.map((f) => f.id === id ? { ...f, actif } : f));
    }
    queryClient.invalidateQueries({ queryKey: ['fournisseurs', mama_id] });
    queryClient.invalidateQueries({ queryKey: ['fournisseurs-autocomplete', mama_id] });
    return { error };
  }

  // Export Excel
  function exportFournisseursToExcel(fournisseurs = []) {
    const datas = (fournisseurs || []).map((f) => ({
      id: f.id,
      nom: f.nom,
      tel: f.contact?.tel || '',
      contact: f.contact?.nom || '',
      email: f.contact?.email || '',
      actif: f.actif
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
    fournisseurs,
    loading,
    error,
    fetchFournisseurs,
    createFournisseur,
    updateFournisseur,
    toggleFournisseurActive,
    exportFournisseursToExcel,
    importFournisseursFromExcel
  };
}

export default useFournisseurs;