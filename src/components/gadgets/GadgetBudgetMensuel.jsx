import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth.ts';

export default function GadgetBudgetMensuel() {
  const { mamaId } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['budget-mensuel', mamaId],
    enabled: !!mamaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_budget_mensuel') // adapte au nom réel de ta vue
        .select('mois, total_ht')
        .eq('mama_id', mamaId)
        .order('mois', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? { total_ht: 0 };
    },
    initialData: { total_ht: 0 },
  });

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <h3 className="font-medium mb-3">Budget mensuel</h3>
      {isLoading && <div className="animate-pulse h-10 bg-white/10 rounded" />}
      {error && <div className="text-red-300 text-sm">Erreur: {error.message}</div>}
      {!isLoading && !error && (
        <div className="text-2xl font-semibold">{Number(data.total_ht ?? 0).toFixed(2)} €</div>
      )}
    </div>
  );
}
