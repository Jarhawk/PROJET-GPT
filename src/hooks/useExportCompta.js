// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { exportToCSV } from '@/lib/export/exportHelpers';
import { toast } from 'sonner';

export default function useExportCompta() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);

  async function fetchJournalLines(month) {
    if (!mama_id) return [];
    const start = `${month}-01`;
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const endStr = end.toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('facture_lignes')
      .select(
        'quantite, prix, tva, facture_id, factures:facture_id(date_facture, fournisseur:fournisseur_id(nom))'
      )
      .eq('mama_id', mama_id)
      .gte('factures.date_facture', start)
      .lt('factures.date_facture', endStr);
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  async function generateJournalCsv(month, download = true) {
    setLoading(true);
    const lignes = await fetchJournalLines(month);
    const rows = lignes.map((l) => {
      const ht = l.quantite * l.prix;
      const tva = ht * ((l.tva || 0) / 100);
      return {
        date: l.factures?.date_facture,
        fournisseur: l.factures?.fournisseur?.nom || '',
        ht,
        tva,
        ttc: ht + tva,
      };
    });
    if (download) {
      exportToCSV(rows, { filename: `journal-achat-${month}.csv` });
      toast.success('Export généré');
    }
    setLoading(false);
    return rows;
  }

  async function mapFournisseursToTiers() {
    if (!mama_id) return {};
    const { data, error } = await supabase
      .from('compta_mapping')
      .select('cle, compte')
      .eq('mama_id', mama_id)
      .eq('type', 'fournisseur');
    if (error) return {};
    const map = {};
    for (const row of data) map[row.cle] = row.compte;
    return map;
  }

  async function exportToERP(month, endpoint, token) {
    try {
      const rows = await generateJournalCsv(month, false);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ journal: rows }),
      });
      if (!res.ok) throw new Error('API error');
      toast.success('Export envoyé');
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi à l'ERP");
    }
  }

  return { generateJournalCsv, mapFournisseursToTiers, exportToERP, loading };
}
