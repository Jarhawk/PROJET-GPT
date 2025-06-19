import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

export default function MamaForm({ mama, onClose, onSaved }) {
  const [values, setValues] = useState({
    nom: mama?.nom || "",
    ville: mama?.ville || "",
    actif: mama?.actif ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = e =>
    setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);

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

    let error = null;
    let saved = null;
    if (mama?.id) {
      const res = await supabase
        .from("mamas")
        .update(values)
        .eq("id", mama.id)
        .select()
        .single();
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
    setSaving(false);
    if (!error && saved) {
      toast.success("Établissement enregistré !");
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
        <label htmlFor="mama-nom" className="sr-only">Nom</label>
        <input
          id="mama-nom"
          className="input input-bordered w-full"
          name="nom"
          value={values.nom}
          onChange={handleChange}
          required
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="mama-ville" className="sr-only">Ville</label>
        <input
          id="mama-ville"
          className="input input-bordered w-full"
          name="ville"
          value={values.ville}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="mama-actif" className="flex items-center gap-1">
          <input
            id="mama-actif"
            type="checkbox"
            name="actif"
            checked={!!values.actif}
            onChange={e => setValues(v => ({ ...v, actif: e.target.checked }))}
          />
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
