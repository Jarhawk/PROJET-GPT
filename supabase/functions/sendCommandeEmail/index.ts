import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { commande, pdfBase64, fournisseur } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MamaStock <no-reply@mamastock.com>",
      to: [fournisseur.email],
      subject: `Commande MamaStock ${commande.id}`,
      html: `<p>Bonjour ${fournisseur.nom},<br/>Veuillez trouver ci-joint la commande ${commande.id}.</p>`,
      attachments: [
        {
          filename: `commande-${commande.id}.pdf`,
          content: pdfBase64,
          type: "application/pdf",
        },
      ],
    }),
  });

  await supabase.from("emails_envoyés").insert({
    commande_id: commande.id,
    email: fournisseur.email,
    statut: res.ok ? "succès" : "erreur",
    mama_id: commande.mama_id,
  });

  if (res.ok) return new Response("Email sent", { status: 200 });
  return new Response("Email failed", { status: 500 });
});
