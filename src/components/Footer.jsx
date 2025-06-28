import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-[#2e2e3a] text-[#f8f8fa] text-sm py-4 px-6 flex flex-col sm:flex-row items-center justify-between rounded-t-2xl shadow-lg z-50">
      <span className="font-semibold tracking-wide mb-2 sm:mb-0">MamaStock 2025</span>
      <span className="flex items-center gap-4">
        <Link to="/rgpd" className="underline hover:text-[#ff5a5f] transition">
          Données &amp; Confidentialité
        </Link>
        <span className="italic text-[#f8f8fa]/80">
          Simplifiez la gestion, concentrez-vous sur l’essentiel.
        </span>
      </span>
    </footer>
  );
}
