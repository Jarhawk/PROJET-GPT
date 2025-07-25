// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <GlassCard className="flex flex-col items-center text-center gap-4">
        <h1 className="text-3xl font-bold text-gold">🚫 Accès refusé</h1>
        <p>Aucun accès attribué, contactez l'administrateur.</p>
        <PrimaryButton onClick={() => navigate("/")}>Retour à l'accueil</PrimaryButton>
      </GlassCard>
    </PageWrapper>
  );
}
