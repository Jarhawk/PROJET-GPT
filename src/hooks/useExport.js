// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
// useAuth est renommé pour éviter un conflit avec l'alias d'export ci-dessous
import { useAuth as useAuthHook } from '@/hooks/useAuth';
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
  const { mama_id } = useAuthHook();
  const [loading, setLoading] = useState(false);

  async function exportData({ type, format, options = {} }) {
    if (!mama_id) return null;
    setLoading(true);
    try {
      let data = [];
      if (type === 'fiches') {
        const { data: rows } = await supabase
          .from('fiches_techniques')
          .select(
            'id, nom, actif, cout_par_portion, portions, famille, prix_vente, type_carte, sous_type_carte, carte_actuelle, cout_total, cout_portion, rendement'
          )
          .eq('mama_id', mama_id);
        data = rows || [];
      } else if (type === 'inventaire') {
        const { data: invs } = await supabase
          .from('inventaires')
          .select('id, date_inventaire, reference, zone, date_debut, cloture')
          .eq('mama_id', mama_id);
        const invsArr = Array.isArray(invs) ? invs : [];
        const ids = [];
        for (const i of invsArr) ids.push(i.id);
        let lignes = [];
        if (ids.length) {
          const { data: lData } = await supabase
            .from('inventaire_lignes')
            .select(
              'inventaire_id, produit_id, quantite, quantite_theorique, quantite_reelle, zone_id, motif'
            )
            .eq('mama_id', mama_id)
            .in('inventaire_id', ids);
          lignes = Array.isArray(lData) ? lData : [];
        }
        const lignesArr = Array.isArray(lignes) ? lignes : [];
        const tmp = [];
        for (const inv of invsArr) {
          const lines = [];
          for (const l of lignesArr) {
            if (l.inventaire_id === inv.id) lines.push(l);
          }
          tmp.push({ ...inv, lignes: lines });
        }
        data = tmp;
      } else if (type === 'produits') {
        const { data: rows } = await supabase
          .from('produits')
          .select('id, nom, famille_id, sous_famille_id, unite_id, actif')
          .eq('mama_id', mama_id);
        data = Array.isArray(rows) ? rows : [];
      } else if (type === 'factures') {
        let query = supabase
          .from('factures')
          .select(
            'id, numero, date_facture, fournisseur_id, total_ht, total_ttc, lignes:facture_lignes!facture_id(id, produit_id, quantite, prix, tva)'
          )
          .eq('mama_id', mama_id)
          .eq('lignes.mama_id', mama_id);
        if (options.start) query = query.gte('date_facture', options.start);
        if (options.end) query = query.lte('date_facture', options.end);
        const { data: rows } = await query;
        data = Array.isArray(rows) ? rows : [];
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

// Certains tests attendent que ce hook soit également exposé sous le nom useAuth
// on ré-exporte donc le hook pour maintenir la compatibilité.
export { useExport as useAuth };
