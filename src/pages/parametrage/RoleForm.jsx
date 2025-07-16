// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { MODULES } from "@/config/modules";

export default function RoleForm({ role, onClose, onSaved }) {
  const { mama_id } = useAuth();
  const [values, setValues] = useState({
    nom: role?.nom || "",
    description: role?.description || "",
    actif: role?.actif ?? true,
  });
  const [rights, setRights] = useState(() => (
    Array.isArray(role?.access_rights) ? role.access_rights : []
  ));
  const [saving, setSaving] = useState(false);

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
      <fieldset className="grid grid-cols-2 gap-2">
        {MODULES.map(m => (
          <label key={m.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rights.includes(m.key)}
              onChange={() => toggleRight(m.key)}
            />
            {m.label}
          </label>
        ))}
      </fieldset>
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
