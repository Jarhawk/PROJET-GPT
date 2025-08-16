import { useNavigate } from "react-router-dom";
import FactureForm from "./FactureForm.jsx";
import GlassCard from "@/components/ui/GlassCard";
import { LiquidBackground } from "@/components/LiquidBackground";

export default function FactureCreate() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10">
        <FactureForm onClose={() => navigate(-1)} />
      </GlassCard>
    </div>
  );
}
