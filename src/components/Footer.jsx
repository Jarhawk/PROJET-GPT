// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-white/10 backdrop-blur-md border-t border-white/10 text-muted-foreground text-sm py-4 px-6 flex flex-col sm:flex-row items-center justify-between rounded-tr-2xl shadow-lg">
      <span className="font-semibold tracking-wide mb-2 sm:mb-0">MamaStock 2025</span>
      <span className="flex items-center gap-4 flex-wrap">
        <Link to="/cgu" className="hover:text-mamastockGold hover:underline transition">
          CGU
        </Link>
        <Link to="/mentions-legales" className="hover:text-mamastockGold hover:underline transition">
          Mentions légales
        </Link>
        <Link to="/contact" className="hover:text-mamastockGold hover:underline transition">
          Contact
        </Link>
      </span>
      <span className="text-xs opacity-70 mt-2 sm:mt-0">
        Accès via Supabase Auth &amp; RLS
      </span>
    </footer>
  );
}
