import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

const steps = [
  "Bienvenue sur MamaStock !",
  "Ajoutez vos premiers produits dans la section Produits.",
  "Enregistrez vos fournisseurs et factures pour suivre les coûts.",
  "Consultez le tableau de bord pour vos statistiques clés.",
];

export default function Onboarding() {
  const { step, loading, saveStep } = useOnboarding();

  if (loading) return <div className="p-8">Chargement...</div>;

  const next = () => {
    const nextStep = step + 1;
    if (nextStep < steps.length) saveStep(nextStep);
  };

  return (
    <div className="p-8 container mx-auto text-center max-w-lg">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Onboarding</h1>
      <p className="mb-6">{steps[step]}</p>
      {step < steps.length - 1 ? (
        <Button onClick={next}>Étape suivante</Button>
      ) : (
        <p className="font-semibold">Onboarding terminé 🎉</p>
      )}
    </div>
  );
}
