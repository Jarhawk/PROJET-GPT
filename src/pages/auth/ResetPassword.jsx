// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo-mamastock.png";
import toast, { Toaster } from "react-hot-toast";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";

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
    if (error) {
      setError("Erreur lors de l'envoi du lien.");
      toast.error("Échec de l'envoi");
    } else {
      toast.success("Email envoyé !");
      setSent(true);
    }
  };

  return (
    <PageWrapper>
      <Toaster position="top-right" />
      <GlassCard className="flex flex-col items-center">
        <img src={logo} alt="MamaStock" className="w-24 h-24 mb-6 rounded-full shadow-md bg-gold/10 object-contain border-4 border-gold/30" />
        <h2 className="text-3xl font-bold text-gold mb-4">Réinitialisation</h2>
        {sent ? (
          <p className="text-center">Un email vous a été envoyé si cette adresse est connue.</p>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
            />
            {error && (
              <div className="text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 text-xs shadow">{error}</div>
            )}
            <PrimaryButton type="submit" className="w-full mt-3">
              Envoyer le lien
            </PrimaryButton>
          </form>
        )}
      </GlassCard>
    </PageWrapper>
  );
}
