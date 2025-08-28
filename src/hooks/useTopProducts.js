// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useTopProducts() {
  const { mama_id } = useAuth();

  async function fetchTop({ debut, fin, limit = 5 } = {}) {
    let query = supabase
      .from('requisition_lignes')
      .select('produit_id, quantite, requisitions!inner(date_requisition, mama_id, statut)')
      .eq('mama_id', mama_id)
      .eq('requisitions.mama_id', mama_id);

    if (debut) query = query.gte('requisitions.date_requisition', debut);
    if (fin) query = query.lte('requisitions.date_requisition', fin);

    const { data, error } = await query;
    if (error) return { data: null, error };

    const rows = Array.isArray(data) ? data : [];
    const mouvements = rows.filter(m => m.requisitions?.statut === 'réalisée');

    const counts = mouvements.reduce((acc, m) => {
      acc[m.produit_id] = (acc[m.produit_id] || 0) + (Number(m.quantite) || 0);
      return acc;
    }, {});

    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([produit_id, quantite]) => ({ produit_id, quantite }));

    return { data: top, error: null };
  }

  return { fetchTop };
}
