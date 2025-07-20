// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function MentionsLegales() {
  const [params] = useSearchParams();
  const [text, setText] = useState("");
  const mamaId = params.get("mama");

  useEffect(() => {
    async function fetchText() {
      if (!mamaId) return;
      const { data } = await supabase
        .from("mamas")
        .select("mentions_legales")
        .eq("id", mamaId)
        .single();
      setText(data?.mentions_legales || "");
    }
    fetchText();
  }, [mamaId]);

  return (
    <div className="p-8 max-w-3xl mx-auto prose">
      <div dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}
