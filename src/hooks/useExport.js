// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  exportToTSV,
  exportToJSON,
  exportToXML,
  exportToHTML,
  exportToMarkdown,
  exportToYAML,
  exportToTXT,
  exportToClipboard,
  printView,
} from '@/lib/export/exportHelpers';
import { toast } from 'sonner';

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
          .select('*')
          .eq('mama_id', mama_id);
        data = res.data || [];
      } else if (type === 'inventaire') {
        const res = await supabase
          .from('inventaires')
          .select('*, lignes:produits_inventaire!inventaire_id(*)')
          .eq('mama_id', mama_id);
        data = res.data || [];
      } else if (type === 'produits') {
        const res = await supabase
          .from('produits')
          .select(
            'id, nom, famille_id, sous_famille_id, famille:familles!fk_produits_famille(nom), sous_famille:sous_familles!fk_produits_sous_famille(nom), fournisseur_produits:fournisseur_produits!fournisseur_produits_produit_id_fkey(*, fournisseur:fournisseurs!fk_fournisseur_produits_fournisseur_id(nom))'
          )
          .eq('mama_id', mama_id);
        data = res.data || [];
      } else if (type === 'factures') {
        let query = supabase
          .from('factures')
          .select('*, lignes:facture_lignes!facture_id(*)')
          .eq('mama_id', mama_id);
        if (options.start) query = query.gte('date_facture', options.start);
        if (options.end) query = query.lte('date_facture', options.end);
        const res = await query;
        data = res.data || [];
      }

      if (format === 'pdf') exportToPDF(data, options);
      else if (format === 'excel') exportToExcel(data, options);
      else if (format === 'csv') exportToCSV(data, options);
      else if (format === 'tsv') exportToTSV(data, options);
      else if (format === 'json') exportToJSON(data, options);
      else if (format === 'xml') exportToXML(data, options);
      else if (format === 'html') exportToHTML(data, options);
      else if (format === 'markdown') exportToMarkdown(data, options);
      else if (format === 'yaml') exportToYAML(data, options);
      else if (format === 'txt') exportToTXT(data, options);
      else if (format === 'clipboard') await exportToClipboard(data, options);
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
