// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import GlassCard from '@/components/ui/GlassCard';
import { LiquidBackground } from '@/components/LiquidBackground';
import ProduitForm from '@/components/produits/ProduitForm';

export default function ProduitFormPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10 w-full max-w-xl">
        <ProduitForm />
      </GlassCard>
    </div>
  );
}
