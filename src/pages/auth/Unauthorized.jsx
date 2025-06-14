import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1c2e] via-[#232a34] to-[#bfa14d] overflow-hidden">
      {/* Animations LiquidGlass */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[400px] bg-gradient-to-br from-[#bfa14d] via-[#fff8e1]/70 to-[#c4a65d]/0 blur-[90px] rounded-full opacity-40 animate-liquid" />
        <div className="absolute bottom-[-20%] right-[-18%] w-[480px] h-[420px] bg-gradient-to-br from-[#fff8e1]/90 via-white/60 to-transparent blur-[80px] rounded-full opacity-20 animate-liquid2" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[280px] h-[180px] bg-white/20 blur-2xl rounded-[36%_54%_41%_59%/50%_41%_59%_50%] opacity-15 animate-liquid3" />
      </div>

      <div className="z-10 w-full max-w-md mx-auto">
        <div className="rounded-2xl shadow-2xl bg-white/30 dark:bg-[#202638]/40 border border-white/30 backdrop-blur-xl px-8 py-12 flex flex-col items-center text-center glass-panel auth-card">
          <h1 className="text-3xl font-bold text-mamastockGold mb-4 drop-shadow">🚫 Accès refusé</h1>
          <p className="text-mamastockText mb-6">
            Vous n'avez pas les droits nécessaires pour accéder à cette page.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-2 px-6 py-2 rounded-xl bg-mamastockGold text-white font-semibold shadow hover:bg-[#b89730] transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
