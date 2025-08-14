// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import useFormErrors from "@/hooks/useFormErrors";
import MamaLogo from "@/components/ui/MamaLogo";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PreviewBanner from "@/components/ui/PreviewBanner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { makeId } from "@/utils/formIds";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const { errors, setError, clearErrors } = useFormErrors();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, signInWithPassword } = useAuth();
  const emailId = useMemo(() => makeId("fld"), []);
  const passwordId = useMemo(() => makeId("fld"), []);

  useEffect(() => {
    if (session) {
      const redirectTo = location.state?.from || "/dashboard";
      navigate(redirectTo, { replace: true });
    }
  }, [session, navigate, location]);

  if (loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (formLoading) return;
    clearErrors();
    if (!email) setError("email", "Email requis");
    if (!password) setError("password", "Mot de passe requis");
    if (!email || !password) return;

    setFormLoading(true);
    const { error } = await signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      console.error(error);
      setError("password", error.message || String(error));
      toast.error(error.message || "Échec de la connexion");
    }
    setFormLoading(false);
  };

  return (
    <PageWrapper>
      <PreviewBanner />
      <GlassCard title="Connexion" className="flex flex-col items-center">
        <div className="mb-6">
          <MamaLogo width={96} />
        </div>
        <p className="text-xs text-white/70 text-center mb-6">
          Plateforme F&B<br />by MamaStock
        </p>
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor={emailId} className="block text-xs font-semibold text-white/90 mb-1">
              Email
            </label>
            <Input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="email"
              required
              placeholder="votre@email.com"
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor={passwordId} className="block text-xs font-semibold text-white/90 mb-1">
              Mot de passe
            </label>
            <Input
              id={passwordId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            className="mt-3 flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={!email || !password || formLoading}
          >
            {formLoading ? (
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

