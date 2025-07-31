// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";
import { useLocation } from "react-router-dom";

export default function PageWrapper({ children, className = '', intensity = 1 }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const previewIntensity = parseFloat(params.get('intensity'));
  const finalIntensity = params.has('preview') && !Number.isNaN(previewIntensity)
    ? Math.min(Math.max(previewIntensity, 0.2), 2)
    : intensity;
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-[clamp(1rem,4vw,2rem)] overflow-hidden">
      <LiquidBackground showParticles intensity={finalIntensity} />
      <WavesBackground className="opacity-40" />
      <MouseLight />
      <TouchLight />
      <div className={`w-full max-w-md relative z-10 bg-white/10 border border-white/20 backdrop-blur-xl p-6 rounded-2xl shadow-lg ${className}`}>{children}</div>
    </div>
  );
}
