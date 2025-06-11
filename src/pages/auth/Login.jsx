import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo-mamastock.png";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading } = useAuth();

  // ✅ Redirection propre (évite navigate dans le rendu)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Identifiants incorrects ou compte inactif.");
      setLoading(false);
    } else {
      setTimeout(() => {
        setLoading(false);
        navigate("/");
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1c2e] via-[#232a34] to-[#bfa14d] relative overflow-hidden">
      {/* Liquid/Glass dynamic background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Big gold blur top left */}
        <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[400px] bg-gradient-to-br from-[#bfa14d] via-[#fff8e1]/70 to-[#c4a65d]/0 blur-[90px] rounded-full opacity-40 animate-liquid" />
        {/* White flare bottom right */}
        <div className="absolute bottom-[-20%] right-[-18%] w-[480px] h-[420px] bg-gradient-to-br from-[#fff8e1]/90 via-white/60 to-transparent blur-[80px] rounded-full opacity-20 animate-liquid2" />
        {/* Subtle center ripple */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[280px] h-[180px] bg-white/20 blur-2xl rounded-[36%_54%_41%_59%/50%_41%_59%_50%] opacity-15 animate-liquid3" />
      </div>
      <div className="z-10 w-full max-w-md mx-auto">
        <div
          className="rounded-2xl shadow-2xl bg-white/30 dark:bg-[#202638]/40 border border-white/30 backdrop-blur-xl px-8 py-12 flex flex-col items-center glass-panel"
          style={{
            boxShadow: "0 10px 32px 0 rgba(50,50,80,0.14), 0 1.5px 10px 0 rgba(191,161,77,0.10)",
            backdropFilter: "blur(32px) saturate(1.3)",
            WebkitBackdropFilter: "blur(32px) saturate(1.3)"
          }}
        >
          <img
            src={logo}
            alt="MamaStock"
            className="w-24 h-24 mb-6 rounded-full shadow-md bg-mamastockGold/10 object-contain border-4 border-mamastockGold/30"
            style={{ boxShadow: "0 2px 20px 0 #bfa14d50" }}
          />
          <h2 className="text-3xl font-bold text-mamastockGold drop-shadow mb-1 text-center tracking-wide">
            Connexion
          </h2>
          <p className="text-xs text-mamastockText/70 text-center mb-6">
            Plateforme F&B<br />by MamaStock
          </p>
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-mamastockText/90 mb-1">Email</label>
              <input
                className="w-full rounded-xl border border-mamastockGold/30 bg-white/70 dark:bg-[#202638]/50 py-2 px-4 text-mamastockBg dark:text-white placeholder-mamastockText/40 focus:outline-none focus:ring-2 focus:ring-mamastockGold/30 backdrop-blur transition"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mamastockText/90 mb-1">Mot de passe</label>
              <input
                className="w-full rounded-xl border border-mamastockGold/30 bg-white/70 dark:bg-[#202638]/50 py-2 px-4 text-mamastockBg dark:text-white placeholder-mamastockText/40 focus:outline-none focus:ring-2 focus:ring-mamastockGold/30 backdrop-blur transition"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 text-xs shadow animate-fade-in">{error}</div>
            )}
            <button
              className="w-full mt-3 py-2 rounded-xl bg-mamastockGold hover:bg-[#b89730] text-white font-semibold text-lg shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loader-glass" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .loader-glass {
          border: 2px solid #fff;
          border-top: 2px solid #bfa14d;
          border-radius: 50%;
          width: 1rem;
          height: 1rem;
          margin-right: 8px;
          animation: spin .9s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        .animate-fade-in { animation: fadeIn 0.7s;}
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .animate-liquid {
          animation: glassMove 12s ease-in-out infinite alternate;
        }
        .animate-liquid2 {
          animation: glassMove2 18s ease-in-out infinite alternate;
        }
        .animate-liquid3 {
          animation: glassMove3 20s ease-in-out infinite alternate;
        }
        @keyframes glassMove {
          0% { transform: scale(1) translate(0, 0);}
          100% { transform: scale(1.14) translate(35px, 32px);}
        }
        @keyframes glassMove2 {
          0% { transform: scale(1) translate(0, 0);}
          100% { transform: scale(1.08) translate(-48px, 12px);}
        }
        @keyframes glassMove3 {
          0% { transform: scale(1.06) translate(0, 0);}
          100% { transform: scale(1) translate(12px, -32px);}
        }
        .glass-panel {
          background: linear-gradient(125deg, rgba(255,255,255,0.24) 40%, rgba(191,161,77,0.11) 100%);
        }
      `}</style>
    </div>
  );
}
