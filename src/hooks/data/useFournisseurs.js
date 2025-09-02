// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function useFournisseurs(params = {}) {
  const { mama_id } = useAuth();
  const {
    search = '',
    actif = true,
    page = 1,
    limit = 50,
  } = params;

  const filtre = { search, actif, page, limit };

  return useQuery({
    queryKey: ['fournisseurs', mama_id, filtre],
    enabled: !!mama_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      let query = supabase
        .from('fournisseurs')
        .select('id, nom, actif, mama_id')
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      if (search) query = query.ilike('nom', `%${search}%`);
      if (actif !== null && actif !== undefined) query = query.eq('actif', actif);

      const { data, error } = await query;
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];

      const ids = rows.map(r => r.id);
      let contacts = [];
      if (ids.length) {
        const { data: contactData, error: contactError } = await supabase
          .from('fournisseur_contacts')
          .select('fournisseur_id, nom, email, tel')
          .eq('mama_id', mama_id)
          .in('fournisseur_id', ids);
        if (contactError) throw contactError;
        contacts = Array.isArray(contactData) ? contactData : [];
      }
      const contactsBySupplier = new Map(contacts.map(c => [c.fournisseur_id, c]));
      return rows.map(f => ({ ...f, contact: contactsBySupplier.get(f.id) || null }));
    },
  });
}

export default useFournisseurs;
