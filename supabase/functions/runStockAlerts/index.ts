import { serve } from "https://deno.land/std/http/server.ts";
import { supabase } from "@/lib/supabase";

serve(async () => {

  const { data: mamas } = await supabase.from("mamas").select("id");

  for (const mama of mamas ?? []) {
    await supabase.rpc("check_alertes_rupture", { p_mama: mama.id });
    await supabase.from("logs_activite").insert({
      mama_id: mama.id,
      type: "stock",
      module: "alertes",
      description: "Vérification des alertes de rupture",
    });
  }

  return new Response("ok", { status: 200 });
});
