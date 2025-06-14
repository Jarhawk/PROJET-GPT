import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1c2e] via-[#232a34] to-[#bfa14d] overflow-hidden">
      {/* Liquid background animations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-10 -left-20 w-[480px] h-[420px] bg-gradient-to-br from-[#bfa14d] via-[#fff8e1]/70 to-transparent blur-[90px] rounded-full opacity-40 animate-liquid" />
        <div className="absolute bottom-[-20%] right-[-18%] w-[480px] h-[420px] bg-gradient-to-br from-[#fff8e1]/90 via-white/60 to-transparent blur-[80px] rounded-full opacity-20 animate-liquid2" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[280px] h-[180px] bg-white/20 blur-2xl rounded-[36%_54%_41%_59%/50%_41%_59%_50%] opacity-15 animate-liquid3" />
      </div>

      <div className="rounded-2xl shadow-2xl bg-white/30 dark:bg-[#202638]/40 border border-white/30 backdrop-blur-xl px-12 py-16 text-center glass-panel">
        <h1 className="text-6xl font-bold text-mamastockGold mb-4 drop-shadow-md">404</h1>
        <p className="text-xl text-mamastockText mb-6">Page non trouvée</p>
        <Link
          to="/"
          className="inline-block mt-2 px-6 py-2 rounded-xl bg-mamastockGold text-white font-semibold shadow hover:bg-[#b89730] transition"
        >
          Retour à l’accueil
        </Link>
      </div>

    </div>
  );
}
