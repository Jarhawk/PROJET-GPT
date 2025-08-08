// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { supabase } from "@/lib/supabase";
import { useCommandes } from "@/hooks/useCommandes";
import CommandePDF from "@/components/pdf/CommandePDF";

export default function CommandeDetail() {
  const { id } = useParams();
  const { fetchCommandeById } = useCommandes();
  const [commande, setCommande] = useState(null);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    fetchCommandeById(id).then(data => setCommande(data));
  }, [id, fetchCommandeById]);

  useEffect(() => {
    if (commande?.template_id) {
      supabase
        .from("templates_commandes")
        .select("*")
        .eq("id", commande.template_id)
        .single()
        .then(({ data }) => setTemplate(data || null));
    }
  }, [commande]);

  if (!commande) return <div>Chargement...</div>;

  const fournisseur = commande.fournisseur;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Commande {commande.reference}</h1>
      <PDFDownloadLink
        document={<CommandePDF commande={commande} template={template} fournisseur={fournisseur} />}
        fileName={`commande-${commande.id}.pdf`}
        className="btn btn-sm bg-blue-600 text-white mt-3"
      >
        {({ loading }) => (loading ? "Préparation..." : "Télécharger PDF")}
      </PDFDownloadLink>
    </div>
  );
}

