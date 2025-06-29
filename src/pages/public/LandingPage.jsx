// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import PageIntro from "@/components/ui/PageIntro";
import useAuth from "@/hooks/useAuth";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !loading) navigate("/dashboard");
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-white p-4">
      <LiquidBackground showParticles />
      <WavesBackground className="opacity-40" />
      <MouseLight />
      <TouchLight />
      <GlassCard className="w-full max-w-2xl p-8 space-y-8 text-center relative z-10">
        <PageIntro />
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition">
            Se connecter
          </Link>
          <Link to="/signup" className="px-6 py-3 rounded-xl bg-mamastockGold hover:bg-mamastockGoldHover text-mamastockBg transition">
            Créer un compte
          </Link>
        </div>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Pourquoi MamaStock ?</h2>
          <p>
            Réduisez les pertes, maîtrisez vos marges et gagnez du temps grâce à un outil tout-en-un pensé pour la restauration.
          </p>
          <h2 className="text-2xl font-semibold">Fonctionnalités clés</h2>
          <ul className="list-disc list-inside text-left max-w-md mx-auto space-y-1">
            <li>Gestion des produits et des fournisseurs</li>
            <li>Suivi des coûts et reporting détaillé</li>
            <li>Processus d'inventaire simplifié</li>
          </ul>
          <h2 className="text-2xl font-semibold">Ils nous font confiance</h2>
          <p className="opacity-80">
            Plusieurs groupes de restaurants utilisent déjà MamaStock au quotidien.
          </p>
        </section>
      </GlassCard>
      <footer className="mt-6 text-sm text-white/70 relative z-10">© MamaStock 2025</footer>
    </div>
  );
}
