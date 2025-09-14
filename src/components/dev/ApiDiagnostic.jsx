import { supabase } from '@/lib/supabaseClient';
import { run } from '@/lib/supa/fetcher';

export default function ApiDiagnostic({ mamaId }) {
  const test = async () => {
    if (!import.meta.env.DEV) return;

    console.debug('[diag] mamaId', mamaId);

    console.debug('[diag] mamas/logo_url');
    console.debug(
      await run(
        supabase
          .from('mamas')
          .select('logo_url')
          .eq('id', mamaId)
          .maybeSingle()
      )
    );

    console.debug('[diag] fournisseurs');
    console.debug(
      await run(
        supabase
          .from('fournisseurs')
          .select('id,nom')
          .eq('mama_id', mamaId)
          .limit(3)
      )
    );

    console.debug('[diag] ruptures');
    console.debug(
      await run(
        supabase
          .from('v_alertes_rupture_api')
          .select('produit_id,nom,stock_actuel,stock_min,manque')
          .limit(3)
      )
    );
  };
  return (
    <button onClick={test} style={{ padding: 8, borderRadius: 8 }}>
      Diagnostic API
    </button>
  );
}
