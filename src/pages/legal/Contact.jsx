// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link } from "react-router-dom";
import LegalLayout from "@/layout/LegalLayout";

export default function Contact() {
  return (
    <LegalLayout title="Contact" description="Support et assistance MamaStock">
      <h1 className="text-3xl font-bold mb-4">Nous contacter</h1>
      <p className="mb-6 max-w-xl text-center">
        Pour toute question sur l'application ou l'utilisation de vos données, vous pouvez
        nous écrire à&nbsp;
        <a href="mailto:contact@mamastock.com" className="underline text-mamastockGold">contact@mamastock.com</a>.
        Nous répondons généralement sous 48&nbsp;heures ouvrées.
      </p>
      <Link
        to="/"
        className="inline-block px-6 py-2 rounded-xl bg-glass border border-borderGlass hover:bg-white/20 transition backdrop-blur"
      >
        Retour à l'accueil
      </Link>
    </LegalLayout>
  );
}
