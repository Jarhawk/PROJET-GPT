import Navbar from "@/layout/Navbar";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

/**
 * Layout pour les utilisateurs en lecture seule (viewer).
 * Pas de sidebar, uniquement la navbar + contenu centré.
 */
export default function ViewerLayout({ children }) {
  return (
    <div className="relative flex flex-col min-h-screen text-white text-shadow overflow-hidden">
      <LiquidBackground showParticles />
      <WavesBackground className="opacity-40" />
      <MouseLight />
      <TouchLight />
      <Navbar />
      <main className="flex-1 px-4 py-6 flex justify-center items-start overflow-y-auto relative z-10">
        <div className="w-full max-w-5xl bg-glass backdrop-blur-lg border border-borderGlass rounded-xl shadow-md p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
