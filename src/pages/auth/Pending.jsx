import { GlassCard } from "@/components/ui/GlassCard";

export default function Pending() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white mb-2">Compte en cours de création…</h1>
        <p className="text-white/80">Merci de patienter pendant la configuration de votre compte utilisateur.</p>
      </GlassCard>
    </div>
  );
}
