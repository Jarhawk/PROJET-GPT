import { useNavigate } from "react-router-dom";
import { useSuppliers } from "@/hooks/useSuppliers";
import FactureForm from "./FactureForm.jsx";
import GlassCard from "@/components/ui/GlassCard";
import { LiquidBackground } from "@/components/LiquidBackground";

export default function FactureCreate() {
  const navigate = useNavigate();
  const { suppliers } = useSuppliers();
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10">
        <FactureForm suppliers={suppliers} onClose={() => navigate(-1)} />
      </GlassCard>
    </div>
  );
}
