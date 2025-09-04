// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState } from "react";

import { useAuth } from '@/hooks/useAuth';
import PrimaryButton from "@/components/ui/PrimaryButton";
import { toast } from 'sonner';
import GlassCard from "@/components/ui/GlassCard";

export default function RGPDConsentForm() {
  const { user_id, mama_id } = useAuth();
  const [values, setValues] = useState({ cookies: false, interne: false, tiers: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
  setValues((v) => ({ ...v, [e.target.name]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const payload = {
      utilisateur_id: user_id,
      user_id,
      mama_id,
      type_consentement: "global",
      consentement: values.cookies && values.interne && values.tiers,
      date_consentement: new Date().toISOString()
    };
    try {
      setLoading(true);
      const { error } = await supabase.from("consentements_utilisateur").insert([
      payload]
      );
      if (error) throw error;
      toast.success("Consentement enregistré");
    } catch (err) {
      toast.error(err.message || "Erreur d'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard title="Consentement RGPD">
      <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex items-center gap-2">
        <input type="checkbox" name="cookies" checked={values.cookies} onChange={handleChange} />
        J'accepte l'utilisation des cookies
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="interne" checked={values.interne} onChange={handleChange} />
        J'accepte l'usage interne de mes données
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="tiers" checked={values.tiers} onChange={handleChange} />
        J'accepte le partage avec des tiers
      </label>
      <PrimaryButton type="submit" disabled={loading || !(values.cookies && values.interne && values.tiers)}>
        {loading ? "Enregistrement..." : "Valider"}
      </PrimaryButton>
      </form>
    </GlassCard>);

}