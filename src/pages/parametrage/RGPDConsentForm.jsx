// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import PrimaryButton from "@/components/ui/PrimaryButton";
import toast, { Toaster } from "react-hot-toast";

export default function RGPDConsentForm() {
  const { user_id, mama_id } = useAuth();
  const [values, setValues] = useState({ cookies: false, interne: false, tiers: false });
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setValues(v => ({ ...v, [e.target.name]: e.target.checked }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    const payload = {
      utilisateur_id: user_id,
      mama_id,
      type_consentement: "global",
      donne: values.cookies && values.interne && values.tiers,
      date_consentement: new Date().toISOString(),
    };
    try {
      setLoading(true);
      const { error } = await supabase.from("consentements_utilisateur").insert([
        payload,
      ]);
      if (error) throw error;
      toast.success("Consentement enregistré");
    } catch (err) {
      toast.error(err.message || "Erreur d'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-6 space-y-4" onSubmit={handleSubmit}>
      <Toaster />
      <h1 className="text-xl font-bold">Consentement RGPD</h1>
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
  );
}
