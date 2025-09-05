import { supabase } from '@/lib/supabaseClient';
import { run } from '@/lib/supa/fetcher';

export default function ApiDiagnostic({ mamaId }) {
  const test = async () => {
    console.log('[diag] mamaId', mamaId);

    console.log('[diag] mamas/logo_url');
    console.log(
      await run(
        supabase
          .from('mamas')
          .select('logo_url')
          .eq('id', mamaId)
          .maybeSingle()
      )
    );

    console.log('[diag] fournisseurs');
    console.log(
      await run(
        supabase
          .from('fournisseurs')
          .select('id,nom')
          .eq('mama_id', mamaId)
          .limit(3)
      )
    );

    console.log('[diag] ruptures');
    console.log(
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
