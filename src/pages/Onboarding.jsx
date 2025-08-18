// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

const steps = [
  "Bienvenue sur MamaStock !",
  "Ajoutez vos premiers produits dans la section Produits.",
  "Enregistrez vos fournisseurs et factures pour suivre les coûts.",
  "Consultez le tableau de bord pour vos statistiques clés.",
];

export default function Onboarding() {
  const { step, loading, saveStep } = useOnboarding();

  if (loading) return <LoadingSpinner message="Chargement..." />;

  const next = () => {
    const nextStep = step + 1;
    if (nextStep < steps.length) saveStep(nextStep);
  };

  return (
    <div className="p-8 flex justify-center">
      <GlassCard className="w-full max-w-lg text-center space-y-6">
                <h1 className="text-2xl font-bold">Onboarding</h1>
        <p>{steps[step]}</p>
        {step < steps.length - 1 ? (
          <Button onClick={next}>Étape suivante</Button>
        ) : (
          <p className="font-semibold">Onboarding terminé 🎉</p>
        )}
      </GlassCard>
    </div>
  );
}
