// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import { supabase } from "@/lib/supabase";
import { useCommandes } from "@/hooks/useCommandes";
import CommandePDF from "@/components/pdf/CommandePDF";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

async function generateCommandePDFBase64(commande, template, fournisseur) {
  const blob = await pdf(
    <CommandePDF commande={commande} template={template} fournisseur={fournisseur} />,
  ).toBlob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export default function CommandeDetail() {
  const { id } = useParams();
  const { currentCommande: commande, fetchCommandeById, loading } = useCommandes();
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    fetchCommandeById(id);
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

  if (loading || !commande) return <div>Chargement...</div>;

  const fournisseur = commande.fournisseur;

  const handleSendEmail = async () => {
    try {
      const base64 = await generateCommandePDFBase64(commande, template, fournisseur);
      const { error } = await supabase.functions.invoke("sendCommandeEmail", {
        body: {
          commande,
          fournisseur,
          pdfBase64: base64,
        },
      });

      if (error) throw error;
      toast.success("Email envoyé au fournisseur");
    } catch {
      toast.error("Erreur lors de l'envoi de l'email");
    }
  };

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
      <Button onClick={handleSendEmail} className="mt-2 bg-green-600 text-white">
        📩 Envoyer par email
      </Button>
    </div>
  );
}

