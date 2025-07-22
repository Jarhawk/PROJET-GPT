// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import MamaLogo from "@/components/ui/MamaLogo";
import ResetAuthButton from "@/components/ResetAuthButton";
import toast from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import useFormErrors from "@/hooks/useFormErrors";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PreviewBanner from "@/components/ui/PreviewBanner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { errors, setError, clearErrors } = useFormErrors();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const {
    session,
    userData,
    loading: authLoading,
    getAuthorizedModules,
    login,
    error: authError,
    resetAuth,
  } = useAuth();

  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current) return;
    if (!session || authLoading) return;
    if (!userData) return;
    if (!userData.role) {
      toast.error(
        "Erreur de permission – rôle utilisateur non trouvé. Merci de contacter l’administrateur."
      );
      navigate("/login");
      return;
    }
    redirectedRef.current = true;
    if (userData.actif === false && pathname !== "/blocked") {
      navigate("/blocked");
      return;
    }
    const rights = getAuthorizedModules();
    if (rights.length === 0 && pathname !== "/unauthorized") {
      navigate("/unauthorized");
      return;
    }
    toast.success(`Bienvenue ${session.user.email}`);
    if (pathname !== "/dashboard") navigate("/dashboard");
  }, [session, userData, authLoading, navigate, pathname, getAuthorizedModules]);

  if (authLoading || (session && !userData)) {
    return <LoadingSpinner message="Chargement..." />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    clearErrors();
    if (!email) setError("email", "Email requis");
    if (!password) setError("password", "Mot de passe requis");
    if (!email || !password) return;

    setLoading(true);
    try {
      const { data, error } = await login({ email: email.trim(), password });
      if (error) {
        console.error(error);
        setError("password", error.message || error);
        toast.error(error.message || "Échec de la connexion");
        return;
      }
      if (data) {
        toast.success("Connexion réussie");
        // redirection handled once user data is loaded
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <PreviewBanner />
      {authError && (
        <div className="text-red-500 text-center mb-2 text-sm">
          {authError}
          {resetAuth && (
            <div className="mt-1">
              <ResetAuthButton className="underline" />
            </div>
          )}
        </div>
      )}
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
            <PrimaryButton
              type="submit"
              className="w-full mt-3 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={!email || !password || loading}
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
