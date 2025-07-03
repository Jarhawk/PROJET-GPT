// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link } from "react-router-dom";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden text-white">
      <LiquidBackground showParticles />
      <WavesBackground className="opacity-40" />
      <MouseLight />
      <TouchLight />

      <div className="relative z-10 rounded-2xl shadow-2xl bg-glass border border-borderGlass backdrop-blur-xl px-12 py-16 text-center">
        <h1 className="text-6xl font-bold text-mamastockGold mb-4 drop-shadow-md">404</h1>
        <p className="text-xl text-mamastockText mb-6">Page non trouvée</p>
        <Link
          to="/"
          className="inline-block mt-2 px-6 py-2 rounded-xl bg-mamastockGold text-white font-semibold shadow hover:bg-[#b89730] transition"
        >
          Retour à l’accueil
        </Link>
      </div>

    </div>
  );
}
