import { useState } from "react";
// ✅ Vérifié
import { useNavigate } from "react-router-dom";
import { useTaches } from "@/hooks/useTaches";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function TacheForm() {
  const { createTache } = useTaches();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: "",
    description: "",
    frequence: "unique",
    date_debut: "",
    date_fin: "",
    notification: [],
    module_lie: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleCheck = e => {
    const value = e.target.value;
    setForm(f => {
      const notif = new Set(f.notification);
      if (notif.has(value)) notif.delete(value); else notif.add(value);
      return { ...f, notification: Array.from(notif) };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    console.log("DEBUG form", form);
    try {
      await createTache(form);
      toast.success("Tâche ajoutée !");
      navigate("/taches");
    } catch (err) {
      console.log("DEBUG error", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 max-w-md">
      <label className="block">
        <span>Nom</span>
        <input className="input w-full" name="nom" value={form.nom} onChange={handleChange} required />
      </label>
      <label className="block">
        <span>Description</span>
        <textarea className="input w-full" name="description" value={form.description} onChange={handleChange} />
      </label>
      <label className="block">
        <span>Fréquence</span>
        <select className="input w-full" name="frequence" value={form.frequence} onChange={handleChange}>
          <option value="unique">Unique</option>
          <option value="hebdo">Hebdomadaire</option>
          <option value="mensuelle">Mensuelle</option>
          <option value="quotidien">Quotidien</option>
        </select>
      </label>
      <label className="block">
        <span>Date début</span>
        <input type="date" className="input w-full" name="date_debut" value={form.date_debut} onChange={handleChange} required />
      </label>
      <label className="block">
        <span>Date fin</span>
        <input type="date" className="input w-full" name="date_fin" value={form.date_fin} onChange={handleChange} />
      </label>
      <fieldset className="block">
        <legend>Notification</legend>
        <label className="mr-4">
          <input type="checkbox" value="visuel" checked={form.notification.includes("visuel")} onChange={handleCheck} /> Visuelle
        </label>
        <label>
          <input type="checkbox" value="email" checked={form.notification.includes("email")} onChange={handleCheck} /> Email
        </label>
      </fieldset>
      <label className="block">
        <span>Module lié</span>
        <input className="input w-full" name="module_lie" value={form.module_lie} onChange={handleChange} />
      </label>
      <Button type="submit" disabled={loading}>Enregistrer</Button>
    </form>
  );
}
