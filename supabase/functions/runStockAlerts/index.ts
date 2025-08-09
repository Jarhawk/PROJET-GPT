import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const { data: mamas } = await supabase.from("mamas").select("id");
  for (const mama of mamas || []) {
    await supabase.rpc("check_alertes_rupture", { p_mama: mama.id });
    await supabase.from("logs_activite").insert({
      mama_id: mama.id,
      action: "check_alertes_rupture",
      details: { source: "runStockAlerts" },
    });
  }
  return new Response("ok", { status: 200 });
});
