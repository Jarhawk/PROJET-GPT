// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MamaLogo from "@/components/ui/MamaLogo";
import toast from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import PageWrapper from "@/components/ui/PageWrapper";
import GlassCard from "@/components/ui/GlassCard";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sanitizedEmail = email.trim();

    try {
      const { error } = await signup({ email: sanitizedEmail, password });
      if (error) throw new Error(error);
      navigate("/pending");
    } catch (err) {
      if (err?.message) toast.error(err.message);
      else toast.error("Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <GlassCard className="space-y-4">
        <form onSubmit={handleSignup} className="space-y-4">
        <div className="text-center">
          <MamaLogo width={80} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">Créer un compte</h1>
        </div>
        <div>
          <label className="block text-sm text-white mb-1">Email</label>
          <input
            className="w-full rounded border border-white/30 bg-white/20 py-2 px-3 text-white placeholder-white/70"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-white mb-1">Mot de passe</label>
          <input
            className="w-full rounded border border-white/30 bg-white/20 py-2 px-3 text-white placeholder-white/70"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          className="w-full py-2 rounded bg-mamastockGold text-mamastockBg font-semibold hover:bg-mamastockGoldHover transition"
          disabled={loading}
        >
          {loading ? "Création..." : "S'inscrire"}
        </button>
        </form>
      </GlassCard>
    </PageWrapper>
  );
}
