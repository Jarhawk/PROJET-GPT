import { useParams } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { LiquidBackground } from '@/components/LiquidBackground';

export default function ProduitDetail() {
  const { id } = useParams();
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <GlassCard className="relative z-10 max-w-md text-center">
        Page Produit Detail {id} (en construction)
      </GlassCard>
    </div>
  );
}
