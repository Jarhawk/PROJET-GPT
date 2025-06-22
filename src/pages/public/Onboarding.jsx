import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { useOnboarding } from "@/hooks/useOnboarding";

const steps = [
  "Choisissez votre type d'établissement",
  "Ajoutez vos premiers produits ou fournisseurs",
  "Découvrez la documentation pour aller plus loin",
];

export default function Onboarding() {
  const { step, startOnboarding, nextStep, skip, complete } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    startOnboarding();
  }, []);

  const handleNext = async () => {
    if (step < steps.length - 1) {
      await nextStep();
    } else {
      await complete();
      navigate("/dashboard");
    }
  };

  const handleSkip = async () => {
    await skip();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0f1c2e] via-[#232a34] to-[#bfa14d] text-white">
      <div className="max-w-lg w-full text-center space-y-8">
        <Motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl"
        >
          {steps[step]}
        </Motion.div>
        <div className="flex justify-center gap-4">
          <button
            className="px-5 py-2 rounded bg-mamastockGold text-mamastockBg hover:bg-mamastockGoldHover transition"
            onClick={handleNext}
          >
            {step < steps.length - 1 ? 'Suivant' : 'Terminer'}
          </button>
          <button
            className="px-5 py-2 rounded bg-white/20 hover:bg-white/30 transition"
            onClick={handleSkip}
          >
            Passer
          </button>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-mamastockGold"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
