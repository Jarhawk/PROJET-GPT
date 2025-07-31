// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import GlassCard from "@/components/ui/GlassCard";
import toast, { Toaster } from "react-hot-toast";
import { MODULES } from "@/config/modules";

export default function RoleForm({ role, onClose, onSaved }) {
  const { mama_id, loading: authLoading } = useAuth();
  const [values, setValues] = useState({
    nom: role?.nom || "",
    description: role?.description || "",
    actif: role?.actif ?? true,
  });
  const [rights, setRights] = useState(() => (
    Array.isArray(role?.access_rights) ? role.access_rights : []
  ));
  const [saving, setSaving] = useState(false);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  const handleChange = e =>
    setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const toggleRight = key =>
    setRights(r =>
      r.includes(key) ? r.filter(k => k !== key) : [...r, key]
    );

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    // Anti-doublon création
    if (!role?.id) {
      const { data: exists } = await supabase
        .from("roles")
        .select("id")
        .eq("nom", values.nom)
        .eq("mama_id", mama_id)
        .maybeSingle();
      if (exists) {
        toast.error("Un rôle avec ce nom existe déjà !");
        setSaving(false);
        return;
      }
    }

    try {
      let error = null;
      let saved = null;
      const payload = { ...values, access_rights: rights };
      if (role?.id) {
        const res = await supabase
          .from("roles")
          .update(payload)
          .eq("id", role.id)
          .select()
          .single();
        error = res.error;
        saved = res.data;
      } else {
        const res = await supabase
          .from("roles")
          .insert([{ ...payload, mama_id }])
          .select()
          .single();
        error = res.error;
        saved = res.data;
      }
      if (!error && saved) {
        toast.success("Rôle enregistré !");
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
    <GlassCard title={role ? "Modifier le rôle" : "Nouveau rôle"}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Toaster />
      <div>
        <Label htmlFor="nom">Nom du rôle</Label>
        <Input
          id="nom"
          name="nom"
          value={values.nom}
          onChange={handleChange}
          required
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="actif"
          type="checkbox"
          name="actif"
          checked={!!values.actif}
          onChange={e => setValues(v => ({ ...v, actif: e.target.checked }))}
        />
        <Label htmlFor="actif" className="!mb-0">Actif</Label>
      </div>
      <fieldset className="grid grid-cols-2 gap-2">
        {MODULES.map((m) => (
          <label key={m.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rights.includes(m.key)}
              onChange={() => toggleRight(m.key)}
            />
            <span className="text-sm">{m.label}</span>
          </label>
        ))}
      </fieldset>
        <div className="flex gap-4 mt-4">
          <PrimaryButton type="submit" disabled={saving} className="flex items-center gap-2">
            {saving && <span className="loader-glass" />}Enregistrer
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose} disabled={saving}>
            Annuler
          </SecondaryButton>
        </div>
      </form>
    </GlassCard>
  );
}
