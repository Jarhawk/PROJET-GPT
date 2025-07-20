import { useEffect } from "react";
import Footer from "@/components/Footer";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

export default function LegalLayout({ title = "", description = "", children }) {
  useEffect(() => {
    if (title) {
      document.title = `${title} - MamaStock`;
    }
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }
  }, [title, description]);

  const updated = new Date().toLocaleDateString("fr-FR");

  return (
    <div className="relative flex flex-col min-h-screen text-white overflow-hidden">
      <LiquidBackground showParticles />
      <WavesBackground className="opacity-40" />
      <MouseLight />
      <TouchLight />
      <main className="flex-grow flex flex-col items-center px-4 py-16 relative z-10">
        {children}
        <p className="mt-4 text-sm opacity-70">Dernière mise à jour : {updated}</p>
      </main>
      <Footer />
    </div>
  );
}
