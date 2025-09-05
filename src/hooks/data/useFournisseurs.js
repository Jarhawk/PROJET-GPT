// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';


export function useFournisseurs(params = {}) {
  const { mama_id } = useAuth();
  const {
    search = '',
    actif = true,
    page = 1,
    limit = 50
  } = params;

  const filtre = { search, actif, page, limit };

  return useQuery({
    queryKey: ['fournisseurs', mama_id, filtre],
    enabled: !!mama_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // 1er fetch simple sans embed
      let q1 = supabase
        .from('fournisseurs')
        .select('id, nom, actif', { count: 'exact' })
        .eq('mama_id', mama_id)
        .order('nom', { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      if (search) q1 = q1.ilike('nom', `%${search}%`);
      if (actif !== null && actif !== undefined) q1 = q1.eq('actif', actif);

      const { data: fournisseurs, error: err1, count } = await q1;
      if (err1) {
        console.error('[useFournisseurs] q1', err1); // [diag]
        throw err1;
      }

      const ids = (fournisseurs || []).map((f) => f.id);
      let contactsMap = {};
      let embedError = null;

      if (ids.length) {
        // tentative avec embed
        const { data: embedData, error: embedErr } = await supabase
          .from('fournisseurs')
          .select('id, fournisseur_contacts(nom,email,tel)')
          .in('id', ids);

        if (!embedErr) {
          embedData.forEach((f) => {
            const c = Array.isArray(f.fournisseur_contacts)
              ? f.fournisseur_contacts[0]
              : f.fournisseur_contacts;
            if (c) contactsMap[f.id] = c;
          });
        } else {
          console.warn('[useFournisseurs] embed', embedErr); // [diag]
          if (embedErr.status === 500) {
            // fallback en 2 requêtes
            const { data: contacts, error: contactErr } = await supabase
              .from('fournisseur_contacts')
              .select('id, nom, email, tel, fournisseur_id')
              .eq('mama_id', mama_id)
              .in('fournisseur_id', ids);
            if (!contactErr && contacts) {
              contacts.forEach((c) => {
                contactsMap[c.fournisseur_id] = {
                  nom: c.nom,
                  email: c.email,
                  tel: c.tel,
                };
              });
            } else {
              embedError = contactErr || embedErr;
            }
          } else {
            embedError = embedErr;
          }
        }
      }

      const list = (fournisseurs || []).map((f) => ({
        ...f,
        contact: contactsMap[f.id] || null,
      }));

      return { data: list, count: count || 0, embedError };
    },
  });
}

export default useFournisseurs;
