import { useParams } from "react-router-dom";
import GlassCard from "@/components/ui/GlassCard";
import { LiquidBackground } from "@/components/LiquidBackground";
import FournisseurDetail from "./FournisseurDetail";

export default function FournisseurDetailPage() {
  const { id } = useParams();
  if (!id) return null;
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10 w-full max-w-4xl">
        <FournisseurDetail id={id} />
      </GlassCard>
    </div>
  );
}
