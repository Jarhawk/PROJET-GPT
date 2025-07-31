// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link } from "react-router-dom";
import LegalLayout from "@/layout/LegalLayout";

export default function Licence() {
  return (
    <LegalLayout title="Licence" description="Informations sur la licence MamaStock">
      <h1 className="text-3xl font-bold mb-4">Licence et abonnement</h1>
      <p className="mb-4 max-w-xl text-center">
        MamaStock est proposé sous forme d'abonnement SaaS. Chaque licence donne
        droit à l'utilisation du logiciel pour un établissement identifié.
        Pour connaître nos offres et recevoir un devis personnalisé, contactez-nous
        à&nbsp;
        <a href="mailto:commercial@mamastock.com" className="underline text-mamastockGold">commercial@mamastock.com</a>.
      </p>
      <p className="mb-6 max-w-xl text-center">
        Les conditions complètes de vente et de résiliation sont précisées dans les CGV.
      </p>
      <Link
        to="/"
        className="inline-block px-6 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition"
      >
        Retour à l'accueil
      </Link>
    </LegalLayout>
  );
}
