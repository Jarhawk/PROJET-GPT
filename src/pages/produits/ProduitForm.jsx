// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { LiquidBackground } from '@/components/LiquidBackground';
import ProduitForm from '@/components/produits/ProduitForm';
import { useEffect } from 'react';

export default function ProduitFormPage() {
  useEffect(() => {
    document.title = 'Nouveau produit';
  }, []);
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-6 text-white">
      <LiquidBackground showParticles />
      <ProduitForm />
    </div>
  );
}
