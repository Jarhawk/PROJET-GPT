import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

export default function RoleForm({ role, onClose, onSaved }) {
  const { mama_id } = useAuth();
  const [values, setValues] = useState({
    nom: role?.nom || "",
    description: role?.description || "",
    actif: role?.actif ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = e =>
    setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
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

    let error = null;
    let saved = null;
    if (role?.id) {
      const res = await supabase
        .from("roles")
        .update(values)
        .eq("id", role.id)
        .select()
        .single();
      error = res.error;
      saved = res.data;
    } else {
      const res = await supabase
        .from("roles")
        .insert([{ ...values, mama_id }])
        .select()
        .single();
      error = res.error;
      saved = res.data;
    }
    setSaving(false);
    if (!error && saved) {
      toast.success("Rôle enregistré !");
      if (onSaved) onSaved(saved);
      if (onClose) onClose();
    } else {
      toast.error(error?.message || "Erreur à l'enregistrement !");
    }
  };

  return (
    <form className="space-y-3 p-4" onSubmit={handleSubmit}>
      <Toaster />
      <div>
        <label>Nom du rôle</label>
        <input
          className="input input-bordered w-full"
          name="nom"
          value={values.nom}
          onChange={handleChange}
          required
          autoFocus
        />
      </div>
      <div>
        <label>Description</label>
        <input
          className="input input-bordered w-full"
          name="description"
          value={values.description}
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
        <Button type="submit" disabled={saving}>
          {saving ? (
            <span>
              <span className="animate-spin mr-2">⏳</span>Enregistrement…
            </span>
          ) : (
            "Enregistrer"
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
