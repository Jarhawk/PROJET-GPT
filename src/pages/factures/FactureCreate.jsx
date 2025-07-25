import { useNavigate } from "react-router-dom";
import { useFournisseurs } from "@/hooks/useFournisseurs"; // ✅ Correction Codex
import FactureForm from "./FactureForm.jsx";
import GlassCard from "@/components/ui/GlassCard";
import { LiquidBackground } from "@/components/LiquidBackground";

export default function FactureCreate() {
  const navigate = useNavigate();
  const { fournisseurs } = useFournisseurs(); // ✅ Correction Codex
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10">
        <FactureForm fournisseurs={fournisseurs} onClose={() => navigate(-1)} /> // ✅ Correction Codex
      </GlassCard>
    </div>
  );
}
