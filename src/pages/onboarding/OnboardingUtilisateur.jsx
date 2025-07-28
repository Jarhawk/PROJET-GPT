// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function OnboardingUtilisateur() {
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <GlassCard className="flex flex-col items-center text-center gap-4">
        <h1 className="text-3xl font-bold text-gold">Utilisateur introuvable</h1>
        <p>
          Votre compte n'a pas encore été configuré dans l'application. Merci de
          contacter votre administrateur ou le support.
        </p>
        <div className="flex gap-2">
          <PrimaryButton onClick={() => navigate('/contact')}>
            Contacter le support
          </PrimaryButton>
          <PrimaryButton onClick={() => navigate('/logout')}>
            Se déconnecter
          </PrimaryButton>
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
