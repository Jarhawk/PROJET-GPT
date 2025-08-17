// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabaseClient';

export function useFournisseurs(params = {}) {
  const { mama_id } = useAuth();
  const { search = '', actif = true } = params;

  return useQuery({
    queryKey: ['fournisseurs', mama_id, search, actif],
    enabled: !!mama_id,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      let query = supabase
        .from('fournisseurs')
        .select('id, nom, actif, contact:fournisseur_contacts(nom,email,tel)')
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true });

      if (search) query = query.ilike('nom', `%${search}%`);
      if (actif !== null && actif !== undefined) query = query.eq('actif', actif);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(f => ({
        ...f,
        contact: Array.isArray(f.contact) ? f.contact[0] : f.contact,
      }));
    },
  });
}

export default useFournisseurs;
