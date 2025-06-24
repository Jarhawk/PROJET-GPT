import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import MamaLogo from "@/components/ui/MamaLogo";
import useAuth from "@/hooks/useAuth";
import toast, { Toaster } from "react-hot-toast";
import useFormErrors from "@/hooks/useFormErrors";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { errors, setError, clearErrors } = useFormErrors();
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const [totp, setTotp] = useState("");
  const [twoFA, setTwoFA] = useState(false);

  // Redirection propre (évite navigate dans le rendu)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!email) setError("email", "Email requis");
    if (!password) setError("password", "Mot de passe requis");
    if (!email || !password) return;

    setLoading(true);
    const { data, error, twofaRequired } = await login({ email, password, totp });

    if (error) {
      if (twofaRequired) {
        setTwoFA(true);
        setError("totp", error);
      } else {
        setError("password", error);
      }
      if (error) toast.error(error);
      else toast.error("Échec de la connexion");
      setLoading(false);
    } else {
      const { data: profil } = await supabase
        .from("utilisateurs")
        .select("actif")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!profil) {
        toast.error("Profil inexistant");
        navigate("/unauthorized");
      } else if (profil.actif === false) {
        navigate("/blocked");
      } else {
        toast.success("Connecté !");
        navigate("/dashboard");
      }
    }
  };

  return (
    <PageWrapper>
      <Toaster position="top-right" />
      <GlassCard className="flex flex-col items-center">
        <div className="mb-6">
          <MamaLogo width={96} />
        </div>
        <h2 className="text-3xl font-bold text-gold text-shadow mb-1 text-center">Connexion</h2>
        <p className="text-xs text-white/70 text-center mb-6">Plateforme F&B<br />by MamaStock</p>
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">Email</label>
              <input
                className="w-full rounded-xl border border-gold/30 bg-white/70 dark:bg-[#202638]/50 py-2 px-4 text-background dark:text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/30 backdrop-blur transition"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
                required
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">Mot de passe</label>
              <input
                className="w-full rounded-xl border border-gold/30 bg-white/70 dark:bg-[#202638]/50 py-2 px-4 text-background dark:text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/30 backdrop-blur transition"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>
            {twoFA && (
              <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">Code 2FA</label>
                <input
                  className="w-full rounded-xl border border-gold/30 bg-white/70 dark:bg-[#202638]/50 py-2 px-4 text-background dark:text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/30 backdrop-blur transition"
                  type="text"
                  value={totp}
                  onChange={e => setTotp(e.target.value)}
                  placeholder="000000"
                />
                {errors.totp && (
                  <p className="text-sm text-red-500 mt-1">{errors.totp}</p>
                )}
              </div>
            )}
            <PrimaryButton
              type="submit"
              className="w-full mt-3 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={!email || !password || loading || (twoFA && !totp)}
            >
              {loading ? (
                <>
                  <span className="loader-glass" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </PrimaryButton>
            <div className="text-right mt-2">
              <Link to="/reset-password" className="text-xs text-gold hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
          </form>
        </GlassCard>
      </PageWrapper>
  );
}
