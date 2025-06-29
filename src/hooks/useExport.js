// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  printView,
} from '@/lib/export/exportHelpers';
import toast from 'react-hot-toast';

export default function useExport() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);

  async function exportData({ type, format, options = {} }) {
    if (!mama_id) return null;
    setLoading(true);
    try {
      let data = [];
      if (type === 'fiches') {
        const res = await supabase
          .from('fiches_techniques')
          .select('*, lignes:fiche_lignes(*)')
          .eq('mama_id', mama_id);
        data = res.data || [];
      } else if (type === 'inventaire') {
        const res = await supabase
          .from('inventaires')
          .select('*, lignes:inventaire_lignes(*)')
          .eq('mama_id', mama_id);
        data = res.data || [];
      } else if (type === 'produits') {
        const res = await supabase
          .from('produits')
          .select('*, fournisseur_produits(*, fournisseur:fournisseurs(nom))')
          .eq('mama_id', mama_id);
        data = res.data || [];
      } else if (type === 'factures') {
        let query = supabase
          .from('factures')
          .select('*, lignes:facture_lignes(*)')
          .eq('mama_id', mama_id);
        if (options.start) query = query.gte('date', options.start);
        if (options.end) query = query.lte('date', options.end);
        const res = await query;
        data = res.data || [];
      }

      if (format === 'pdf') exportToPDF(data, options);
      else if (format === 'excel') exportToExcel(data, options);
      else if (format === 'csv') exportToCSV(data, options);
      else if (format === 'print') printView(options.content);

      toast.success('Export effectué');
      return data;
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'export');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { exportData, loading };
}
