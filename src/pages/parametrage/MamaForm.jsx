// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";

export default function MamaForm({ mama, onClose, onSaved }) {
  const { mama_id: myMama, role, loading: authLoading } = useAuth();
  const [values, setValues] = useState({
    nom: mama?.nom || "",
    ville: mama?.ville || "",
    actif: mama?.actif ?? true,
  });
  const [saving, setSaving] = useState(false);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  const handleChange = e =>
    setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    if (role !== "superadmin" && mama?.id !== myMama) {
      toast.error("Action non autorisée");
      setSaving(false);
      return;
    }

    // Vérification anti-doublon (en création uniquement)
    if (!mama?.id) {
      const { data: exists } = await supabase
        .from("mamas")
        .select("id")
        .eq("nom", values.nom)
        .maybeSingle();
      if (exists) {
        toast.error("Un établissement avec ce nom existe déjà !");
        setSaving(false);
        return;
      }
    }

    try {
      let error = null;
      let saved = null;
      if (mama?.id) {
        let query = supabase
          .from("mamas")
          .update(values)
          .eq("id", mama.id);
        if (role !== "superadmin") query = query.eq("id", myMama);
        const res = await query.select().single();
        error = res.error;
        saved = res.data;
      } else {
        const res = await supabase
          .from("mamas")
          .insert([{ ...values }])
          .select()
          .single();
        error = res.error;
        saved = res.data;
      }
      if (!error && saved) {
        toast.success("Établissement enregistré !");
        onSaved?.(saved);
        onClose?.();
      } else {
        throw error;
      }
    } catch (err) {
      toast.error(err?.message || "Erreur à l'enregistrement !");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-3 p-4" onSubmit={handleSubmit}>
      <Toaster />
      <div>
        <label>Nom</label>
        <Input
          className="w-full"
          name="nom"
          value={values.nom}
          onChange={handleChange}
          required
          autoFocus
        />
      </div>
      <div>
        <label>Ville</label>
        <Input
          className="w-full"
          name="ville"
          value={values.ville}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="actif"
            checked={!!values.actif}
            onChange={e => setValues(v => ({ ...v, actif: e.target.checked }))}
          />{" "}
          Actif
        </label>
      </div>
      <div className="flex gap-4 mt-4">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? (
            <span>
              <span className="animate-spin mr-2">⏳</span>Enregistrement…
            </span>
          ) : (
            "Enregistrer"
          )}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onClose} disabled={saving}>
          Annuler
        </SecondaryButton>
      </div>
    </form>
  );
}
