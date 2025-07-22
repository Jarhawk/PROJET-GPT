import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function RoleError() {
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <GlassCard className="flex flex-col items-center text-center gap-4">
        <h1 className="text-3xl font-bold text-gold">Erreur de permission</h1>
        <p>rôle utilisateur non trouvé. Merci de contacter l’administrateur.</p>
        <PrimaryButton onClick={() => navigate("/login")}>Se reconnecter</PrimaryButton>
      </GlassCard>
    </PageWrapper>
  );
}
