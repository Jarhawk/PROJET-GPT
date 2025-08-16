// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

async function detectExistingTable(candidates) {
  for (const t of candidates) {
    try {
      const { error } = await supabase.from(t).select('id').limit(1);
      if (!error) return t;
    } catch {}
  }
  return candidates[0];
}

export function useInvoice(id, { enabled = true } = {}) {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;

  return useQuery({
    queryKey: ['invoice', mamaId, id],
    enabled: enabled && !!id && !!mamaId,
    queryFn: async () => {
      const tableLines = await detectExistingTable(['facture_lignes', 'lignes_facture']);
      const [headerRes, linesRes] = await Promise.all([
        supabase
          .from('factures')
          .select(
            'id, numero, date_facture, fournisseur_id, tva_mode, actif, created_at, updated_at, statut, bon_livraison, total_ht, total_tva, total_ttc, fournisseur:fournisseurs(id, nom)'
          )
          .eq('id', id)
          .eq('mama_id', mamaId)
          .single(),
        supabase
          .from(tableLines)
          .select(
            'id, facture_id, produit_id, quantite, unite, total_ht, pu, pmp, tva, zone_id, position, note, actif, produit:produits(id, nom, code, ref_fournisseur, unite_achat, unite, tva_id, zone_stock_id)'
          )
          .eq('facture_id', id)
          .order('position', { ascending: true })
      ]);
      const { data: facture, error: e1 } = headerRes;
      const { data: lignes, error: e2 } = linesRes;
      if (e1 || e2) throw e1 || e2;
      return { facture, lignes: lignes || [] };
    },
  });
}

export default useInvoice;
