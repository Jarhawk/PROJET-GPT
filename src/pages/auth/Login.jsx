import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import MamaLogo from "@/components/ui/MamaLogo";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
import useFormErrors from "@/hooks/useFormErrors";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { errors, setError, clearErrors } = useFormErrors();
  const navigate = useNavigate();

  const {
    session,
    user,
    login,
    pending,
    mama_id,
    access_rights,
    actif,
  } = useAuth();
  const [totp, setTotp] = useState("");
  const [twoFA, setTwoFA] = useState(false);

  // Redirection après authentification
  useEffect(() => {
    console.log("DEBUG login", session, user);
    if (session && user) {
      navigate("/dashboard");
    }
  }, [session, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    clearErrors();
    if (!email) setError("email", "Email requis");
    if (!password) setError("password", "Mot de passe requis");
    if (!email || !password) return;

    setLoading(true);
    try {
      const { data, error, twofaRequired } = await login({
        email: email.trim(),
        password,
        totp,
      });
      console.debug("login", { data, error });

      if (error) {
        if (twofaRequired) {
          setTwoFA(true);
          setError("totp", error);
        } else {
          setError("password", error);
        }
        toast.error(error?.message || error || "Échec de la connexion");
        return;
      }

      if (pending) {
        toast("Compte en cours de création");
        navigate("/pending");
        return;
      }

      if (actif === false) {
        navigate("/blocked");
        return;
      }

      if (!access_rights || access_rights.length === 0) {
        navigate("/unauthorized");
        return;
      }

      toast.success("Connecté !");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.message || "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
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
        <p className="text-xs text-center text-white/40 mt-4">© MamaStock 2025</p>
      </PageWrapper>
  );
}
