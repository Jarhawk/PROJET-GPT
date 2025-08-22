// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from '@/lib/supabase';
import LegalLayout from "@/layout/LegalLayout";

export default function MentionsLegales() {
  const [params] = useSearchParams();
  const [text, setText] = useState("");
  const mamaId = params.get("mama");

  useEffect(() => {
    async function fetchText() {
      if (mamaId) {
        const { data } = await supabase
          .from("mamas")
          .select("mentions_legales")
          .eq("id", mamaId)
          .single();
        if (data?.mentions_legales) {
          setText(data.mentions_legales);
          return;
        }
      }
      const res = await fetch("/legal/mentions_legales.md");
      setText(await res.text());
    }
    fetchText();
  }, [mamaId]);

  return (
    <LegalLayout title="Mentions légales" description="Informations légales MamaStock">
      <div className="p-8 max-w-3xl mx-auto prose prose-invert whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: text }} />
    </LegalLayout>
  );
}
