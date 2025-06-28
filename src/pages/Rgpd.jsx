import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

export default function Rgpd() {
  return (
    <div className="flex flex-col min-h-[100vh] bg-[#f8f8fa]">
      <div className="flex-grow flex flex-col items-center px-4 pt-16">
        <Card className="max-w-2xl w-full mx-auto p-8 rounded-2xl shadow-xl bg-white">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2e2e3a] mb-4">
            Données &amp; Confidentialité
          </h1>
          <p className="text-[#2e2e3a]/80 mb-4">
            MamaStock attache une grande importance à la protection de vos données personnelles.<br />
            <br />
            <b>Quels types de données&nbsp;?</b> <br />
            Les données collectées (emails, identifiants, informations de gestion F&amp;B) servent uniquement à faire fonctionner l’application, à améliorer votre expérience, et à sécuriser l’accès.
            <br /><br />
            <b>Confidentialité&nbsp;:</b><br />
            Les données ne sont ni vendues, ni partagées à des tiers extérieurs à l’application.<br />
            Seules les personnes autorisées au sein de votre établissement y ont accès.
            <br /><br />
            <b>Droits&nbsp;:</b><br />
            À tout moment, vous pouvez demander la consultation, la modification ou la suppression de vos données en contactant votre administrateur ou l’équipe MamaStock.<br />
            Pour toute question&nbsp;: <a href="mailto:support@mamastock.com" className="underline text-[#ff5a5f]">support@mamastock.com</a>
          </p>
          <Button className="bg-[#ff5a5f] text-white rounded-xl px-6 py-2 mt-4 hover:bg-[#e04b50]">
            <Link to="/">Retour à l’accueil</Link>
          </Button>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
