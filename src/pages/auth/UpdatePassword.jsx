// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from '@/lib/supabaseClient';
import logo from "@/assets/logo-mamastock.png";
import toast, { Toaster } from "react-hot-toast";
import GlassCard from "@/components/ui/GlassCard";
import PageWrapper from "@/components/ui/PageWrapper";
import { Input } from "@/components/ui/input";
import PrimaryButton from "@/components/ui/PrimaryButton";

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
      toast.error("Échec de la mise à jour");
    } else {
      toast.success("Mot de passe modifié");
      setMessage("Mot de passe mis à jour, vous pouvez vous connecter.");
      setTimeout(() => navigate("/login"), 1500);
    }
  };

  return (
    <PageWrapper>
      <Toaster position="top-right" />
      <GlassCard className="flex flex-col items-center">
        <img src={logo} alt="MamaStock" className="w-24 h-24 mb-6 rounded-full shadow-md bg-gold/10 object-contain border-4 border-gold/30" />
        <h2 className="text-3xl font-bold text-gold mb-4">Nouveau mot de passe</h2>
        {message ? (
          <p className="text-center">{message}</p>
        ) : (
          <form onSubmit={handleUpdate} className="w-full flex flex-col gap-4">
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              required
            />
            <Input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirmez le mot de passe"
              required
            />
            {error && (
              <div className="text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 text-xs shadow">{error}</div>
            )}
            <PrimaryButton type="submit" className="w-full mt-3">
              Mettre à jour
            </PrimaryButton>
          </form>
        )}
      </GlassCard>
    </PageWrapper>
  );
}
