// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

export default function Licence() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-8">
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
        className="inline-block px-6 py-2 rounded-xl bg-glass border border-borderGlass hover:bg-white/20 transition backdrop-blur"
      >
        Retour à l'accueil
      </Link>
      <div className="mt-auto w-full">
        <Footer />
      </div>
    </div>
  );
}
