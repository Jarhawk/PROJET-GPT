// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link } from "react-router-dom";
import { watermark } from "@/license";

export default function Footer() {
  return (
    <footer className="w-full bg-glass backdrop-blur-md border-t border-white/10 text-white/90 text-sm py-4 px-6 flex flex-col sm:flex-row items-center justify-between rounded-t-2xl shadow-lg">
      <span className="font-semibold tracking-wide mb-2 sm:mb-0">MamaStock 2025</span>
      <span className="flex items-center gap-4 flex-wrap">
        <Link to="/rgpd" className="underline hover:text-mamastockGold transition">
          Données &amp; Confidentialité
        </Link>
        <Link to="/confidentialite" className="underline hover:text-mamastockGold transition">
          Politique de confidentialité
        </Link>
        <Link to="/mentions-legales" className="underline hover:text-mamastockGold transition">
          Mentions légales
        </Link>
        <Link to="/cgu" className="underline hover:text-mamastockGold transition">
          CGU
        </Link>
        <Link to="/cgv" className="underline hover:text-mamastockGold transition">
          CGV
        </Link>
        <Link to="/contact" className="underline hover:text-mamastockGold transition">
          Contact
        </Link>
        <Link to="/licence" className="underline hover:text-mamastockGold transition">
          Licence
        </Link>
        <span className="italic opacity-80">
          Simplifiez la gestion, concentrez-vous sur l’essentiel.
        </span>
      </span>
      <span className="text-xs opacity-70 mt-2 sm:mt-0">
        {watermark(import.meta.env.VITE_LICENSE_KEY)}
      </span>
    </footer>
  );
}
