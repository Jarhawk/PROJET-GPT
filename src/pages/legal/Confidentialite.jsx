// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import LegalLayout from "@/layout/LegalLayout";

export default function Confidentialite() {
  const [params] = useSearchParams();
  const [text, setText] = useState("");
  const mamaId = params.get("mama");

  useEffect(() => {
    async function fetchText() {
      if (mamaId) {
        const { data } = await supabase
          .from("mamas")
          .select("rgpd_text")
          .eq("id", mamaId)
          .single();
        if (data?.rgpd_text) {
          setText(data.rgpd_text);
          return;
        }
      }
      const res = await fetch("/legal/politique_confidentialite.md");
      setText(await res.text());
    }
    fetchText();
  }, [mamaId]);

  return (
    <LegalLayout title="Politique de confidentialité" description="Politique de confidentialité MamaStock">
      <div className="p-8 max-w-3xl mx-auto prose prose-invert whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: text }} />
    </LegalLayout>
  );
}
