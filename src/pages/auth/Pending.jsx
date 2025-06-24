import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function Pending() {
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <GlassCard className="flex flex-col items-center text-center gap-4">
        <h1 className="text-3xl font-bold text-gold">Compte en cours de création…</h1>
        <p>Votre compte est en cours de création, merci de patienter...</p>
        <PrimaryButton onClick={() => navigate("/logout")}>Se déconnecter</PrimaryButton>
      </GlassCard>
    </PageWrapper>
  );
}
