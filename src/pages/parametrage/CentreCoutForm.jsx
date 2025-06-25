import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

export default function CentreCoutForm({ centre, onClose, onSaved }) {
  const { mama_id } = useAuth();
  const [values, setValues] = useState({
    nom: centre?.nom || "",
    activite: centre?.activite || "",
    type: centre?.type || "",
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
      if (centre?.id) {
        res = await supabase
          .from("cost_centers")
          .update(values)
          .eq("id", centre.id)
          .select()
          .single();
      } else {
        res = await supabase
          .from("cost_centers")
          .insert([{ ...values, mama_id }])
          .select()
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
    <form className="space-y-3 p-4" onSubmit={handleSubmit}>
      <Toaster />
      <div>
        <label>Nom</label>
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
        <label>Activité</label>
        <input
          className="input input-bordered w-full"
          name="activite"
          value={values.activite}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Type</label>
        <input
          className="input input-bordered w-full"
          name="type"
          value={values.type}
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
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
