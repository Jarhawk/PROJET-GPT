// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { pdf } from "@react-pdf/renderer";
import CommandePDF from "@/components/pdf/CommandePDF";

export function useEmailsEnvoyes() {
  const { mama_id, role } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchEmails({
    statut,
    email,
    date_start,
    date_end,
    commande_id,
    page = 1,
    limit = 50,
  } = {}) {
    if (!mama_id) return { data: [], count: 0 };
    setLoading(true);
    setError(null);
    let query = supabase
      .from("emails_envoyes")
      .select(
        "id, commande_id, email, statut, envoye_le, commandes:commande_id(reference)",
        { count: "exact" }
      )
      .eq("mama_id", mama_id)
      .order("envoye_le", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (statut) query = query.eq("statut", statut);
    if (email) query = query.ilike("email", `%${email}%`);
    if (commande_id) query = query.eq("commande_id", commande_id);
    if (date_start) query = query.gte("envoye_le", date_start);
    if (date_end) query = query.lte("envoye_le", date_end);

    const { data, error, count } = await query;
    setLoading(false);
    if (error) {
      setError(error);
      setEmails([]);
      return { data: [], count: 0 };
    }
    setEmails(Array.isArray(data) ? data : []);
    return { data: data || [], count: count || 0 };
  }

  async function resendEmail(id) {
    if (!mama_id) return { error: "mama_id manquant" };
    if (role !== "admin") return { error: "Accès refusé" };

    const { data: record, error: recErr } = await supabase
      .from("emails_envoyes")
      .select("id, commande_id, email, mama_id")
      .eq("id", id)
      .eq("mama_id", mama_id)
      .single();
    if (recErr || !record) return { error: recErr || "Email introuvable" };

    const { data: commande, error: cmdErr } = await supabase
      .from("commandes")
      .select(
        "*, fournisseur:fournisseur_id(id, nom, email), lignes:commande_lignes(*, produit:produit_id(id, nom))"
      )
      .eq("id", record.commande_id)
      .eq("mama_id", mama_id)
      .single();
    if (cmdErr || !commande) return { error: cmdErr || "Commande introuvable" };

    let template = null;
    if (commande.template_id) {
      const { data: tpl } = await supabase
        .from("templates_commandes")
        .select("*")
        .eq("id", commande.template_id)
        .single();
      template = tpl || null;
    }

    const blob = await pdf(
      <CommandePDF commande={commande} template={template} fournisseur={commande.fournisseur} />,
    ).toBlob();

    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(",")[1]);
      };
      reader.readAsDataURL(blob);
    });

    const fournisseur = { ...commande.fournisseur, email: record.email };

    const { error: sendErr } = await supabase.functions.invoke("sendCommandeEmail", {
      body: { commande, fournisseur, pdfBase64: base64 },
    });
    if (sendErr) return { error: sendErr };

    return { data: true };
  }

  return { emails, loading, error, fetchEmails, resendEmail };
}
