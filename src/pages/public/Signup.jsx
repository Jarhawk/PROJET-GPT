// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MamaLogo from "@/components/ui/MamaLogo";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import PageWrapper from "@/components/ui/PageWrapper";
import GlassCard from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PrimaryButton from "@/components/ui/PrimaryButton";

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
      <GlassCard title="Créer un compte" className="space-y-4">
        <form onSubmit={handleSignup} className="space-y-4">
        <div className="text-center">
          <MamaLogo width={80} className="mx-auto mb-4" />
        </div>
        <div>
          <Label htmlFor="signup-email" className="text-white mb-1">Email</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor="signup-pass" className="text-white mb-1">Mot de passe</Label>
          <Input
            id="signup-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <PrimaryButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Création..." : "S'inscrire"}
        </PrimaryButton>
        </form>
      </GlassCard>
    </PageWrapper>
  );
}
