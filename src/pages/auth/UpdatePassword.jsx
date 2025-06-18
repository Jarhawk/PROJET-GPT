import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo-mamastock.png";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Erreur lors de la mise à jour du mot de passe.");
    } else {
      setMessage("Mot de passe mis à jour, vous pouvez vous connecter.");
      setTimeout(() => navigate("/login"), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1c2e] via-[#232a34] to-[#bfa14d] relative overflow-hidden">
      <div className="z-10 w-full max-w-md mx-auto">
        <div className="rounded-2xl shadow-2xl bg-white/30 dark:bg-[#202638]/40 border border-white/30 backdrop-blur-xl px-8 py-12 flex flex-col items-center glass-panel auth-card">
          <img src={logo} alt="MamaStock" className="w-24 h-24 mb-6 rounded-full shadow-md bg-mamastockGold/10 object-contain border-4 border-mamastockGold/30 logo-glow" />
          <h2 className="text-3xl font-bold text-mamastockGold drop-shadow mb-1 text-center tracking-wide">Nouveau mot de passe</h2>
          {message ? (
            <p className="text-mamastockText text-center">{message}</p>
          ) : (
            <form onSubmit={handleUpdate} className="w-full flex flex-col gap-4">
              <input
                className="w-full rounded-xl border border-mamastockGold/30 bg-white/70 dark:bg-[#202638]/50 py-2 px-4 text-mamastockBg dark:text-white placeholder-mamastockText/40 focus:outline-none focus:ring-2 focus:ring-mamastockGold/30 backdrop-blur transition"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                required
              />
              <input
                className="w-full rounded-xl border border-mamastockGold/30 bg-white/70 dark:bg-[#202638]/50 py-2 px-4 text-mamastockBg dark:text-white placeholder-mamastockText/40 focus:outline-none focus:ring-2 focus:ring-mamastockGold/30 backdrop-blur transition"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirmez le mot de passe"
                required
              />
              {error && (
                <div className="text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 text-xs shadow">{error}</div>
              )}
              <button type="submit" className="w-full mt-3 py-2 rounded-xl bg-mamastockGold hover:bg-[#b89730] text-white font-semibold text-lg shadow">
                Mettre à jour
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
