// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTaches } from "@/hooks/useTaches";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";

export default function TacheForm({ task }) {
  const navigate = useNavigate();
  const { createTache, updateTache } = useTaches();
  const { users, fetchUsers } = useUtilisateurs();
  const [form, setForm] = useState({
    titre: task?.titre || "",
    description: task?.description || "",
    assignes: task?.utilisateurs_taches?.map(a => a.utilisateur_id) || [],
    priorite: task?.priorite || "moyenne",
    date_echeance: task?.date_echeance || "",
    statut: task?.statut || "a_faire",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers({ actif: true });
  }, [fetchUsers]);

  const handleChange = e => {
    const { name, value, options } = e.target;
    if (name === "assignes") {
      const vals = Array.from(options).filter(o => o.selected).map(o => o.value);
      setForm(f => ({ ...f, assignes: vals }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (task) {
        await updateTache(task.id, form);
        toast.success("Tâche mise à jour !");
      } else {
        await createTache(form);
        toast.success("Tâche créée !");
      }
      navigate("/taches");
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard title={task ? "Modifier la tâche" : "Nouvelle tâche"} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block">
          <span>Titre</span>
          <input
            className="input w-full"
            name="titre"
            value={form.titre}
            onChange={handleChange}
            required
          />
        </label>
        <label className="block">
          <span>Description</span>
          <textarea
            className="input w-full"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </label>
        <label className="block">
          <span>Assignés</span>
          <select
            multiple
            name="assignes"
            value={form.assignes}
            onChange={handleChange}
            className="input w-full"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span>Priorité</span>
          <select
            className="input w-full"
            name="priorite"
            value={form.priorite}
            onChange={handleChange}
          >
            <option value="basse">Basse</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
          </select>
        </label>
        <label className="block">
          <span>Échéance</span>
          <input
            type="date"
            className="input w-full"
            name="date_echeance"
            value={form.date_echeance}
            onChange={handleChange}
          />
        </label>
        <label className="block">
          <span>Statut</span>
          <select
            className="input w-full"
            name="statut"
            value={form.statut}
            onChange={handleChange}
          >
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
          </select>
        </label>
        <Button type="submit" disabled={loading}>
          {task ? "Mettre à jour" : "Créer"}
        </Button>
      </form>
    </GlassCard>
  );
}
