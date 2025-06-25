import { useEffect, useState } from "react";
// ✅ Vérifié
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function GroupeParamForm({ groupe, onClose, onSaved }) {
  const { role } = useAuth();
  const [values, setValues] = useState({
    nom: groupe?.nom || "",
    description: groupe?.description || "",
  });
  const [mamas, setMamas] = useState([]);
  const [selected, setSelected] = useState(groupe?.mamas_ids || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMamas();
  }, []);

  async function fetchMamas() {
    const { data } = await supabase.from("mamas").select("id, nom").order("nom");
    setMamas(data || []);
  }

  const toggleMama = (id) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((m) => m !== id) : [...s, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role !== "superadmin" || saving) return;
    const payload = { nom: values.nom, description: values.description };
    console.log("DEBUG form", { ...payload, selected });
    try {
      setSaving(true);
      let saved = null;
      if (groupe?.id) {
        const res = await supabase
          .from("groupes")
          .update(payload)
          .eq("id", groupe.id)
          .select()
          .single();
        if (res.error) throw res.error;
        saved = res.data;
        await supabase.from("mamas").update({ groupe_id: null }).eq("groupe_id", groupe.id);
        if (selected.length > 0) {
          await supabase.from("mamas").update({ groupe_id: groupe.id }).in("id", selected);
        }
      } else {
        const res = await supabase
          .from("groupes")
          .insert(payload)
          .select()
          .single();
        if (res.error) throw res.error;
        saved = res.data;
        if (saved && selected.length > 0) {
          await supabase.from("mamas").update({ groupe_id: saved.id }).in("id", selected);
        }
      }
      toast.success("Groupe enregistré");
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      console.log("DEBUG error", err);
      toast.error(err.message || "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-3 p-4" onSubmit={handleSubmit}>
      <div>
        <label>Nom du groupe</label>
        <input
          className="input input-bordered w-full"
          value={values.nom}
          onChange={(e) => setValues({ ...values, nom: e.target.value })}
          required
        />
      </div>
      <div>
        <label>Description</label>
        <textarea
          className="textarea textarea-bordered w-full"
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
        />
      </div>
      <div>
        <label className="block mb-1">Établissements</label>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border p-2 rounded">
          {mamas.map((m) => (
            <label key={m.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggleMama(m.id)}
              />
              {m.nom}
            </label>
          ))}
        </div>
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
