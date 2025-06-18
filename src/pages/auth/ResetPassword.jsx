import { useState } from "react";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo-mamastock.png";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) setError("Erreur lors de l'envoi du lien.");
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1c2e] via-[#232a34] to-[#bfa14d] relative overflow-hidden">
      <div className="z-10 w-full max-w-md mx-auto">
        <div className="rounded-2xl shadow-2xl bg-white/30 dark:bg-[#202638]/40 border border-white/30 backdrop-blur-xl px-8 py-12 flex flex-col items-center glass-panel auth-card">
          <img src={logo} alt="MamaStock" className="w-24 h-24 mb-6 rounded-full shadow-md bg-mamastockGold/10 object-contain border-4 border-mamastockGold/30 logo-glow" />
          <h2 className="text-3xl font-bold text-mamastockGold drop-shadow mb-1 text-center tracking-wide">Réinitialisation</h2>
          {sent ? (
            <p className="text-mamastockText text-center">Un email vous a été envoyé si cette adresse est connue.</p>
          ) : (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <input
                className="w-full rounded-xl border border-mamastockGold/30 bg-white/70 dark:bg-[#202638]/50 py-2 px-4 text-mamastockBg dark:text-white placeholder-mamastockText/40 focus:outline-none focus:ring-2 focus:ring-mamastockGold/30 backdrop-blur transition"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
              />
              {error && (
                <div className="text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 text-xs shadow">{error}</div>
              )}
              <button type="submit" className="w-full mt-3 py-2 rounded-xl bg-mamastockGold hover:bg-[#b89730] text-white font-semibold text-lg shadow">
                Envoyer le lien
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
