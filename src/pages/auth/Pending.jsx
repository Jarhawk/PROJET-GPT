// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { GlassCard } from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";

export default function Pending() {
  return (
    <PageWrapper>
      <GlassCard className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Compte en cours de création…</h1>
        <p className="text-white/80">Merci de patienter pendant la configuration de votre compte utilisateur.</p>
      </GlassCard>
    </PageWrapper>
  );
}
