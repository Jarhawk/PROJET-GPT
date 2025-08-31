// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
import { toast } from 'sonner';

export default function CentreCoutForm({ centre, onClose, onSaved }) {
  const { mama_id } = useAuth();
  const [values, setValues] = useState({
    nom: centre?.nom || "",
    activite: centre?.activite || "",
    actif: centre?.actif ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = e =>
    setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleCheck = e =>
    setValues(v => ({ ...v, [e.target.name]: e.target.checked }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      let res;
      const payload = { nom: values.nom, activite: values.activite, actif: values.actif };
      if (centre?.id) {
        res = await supabase
          .from("centres_de_cout")
          .update(payload)
          .eq("id", centre.id)
          .select('id, nom, activite, actif, mama_id, created_at, updated_at')
          .single();
      } else {
        res = await supabase
          .from("centres_de_cout")
          .insert([{ ...payload, mama_id }])
          .select('id, nom, activite, actif, mama_id, created_at, updated_at')
          .single();
      }
      if (res.error) throw res.error;
      toast.success("Enregistré !");
      onSaved?.(res.data);
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard title={centre ? "Modifier le centre de coût" : "Nouveau centre de coût"}>
      <form className="space-y-3" onSubmit={handleSubmit}>
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
        <label>Activité</label>
        <Input
          className="w-full"
          name="activite"
          value={values.activite}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="actif"
            checked={!!values.actif}
            onChange={handleCheck}
          />{" "}
          Actif
        </label>
      </div>
      <div className="flex gap-4 mt-4">
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onClose} disabled={saving}>
          Annuler
        </SecondaryButton>
      </div>
      </form>
    </GlassCard>
  );
}
