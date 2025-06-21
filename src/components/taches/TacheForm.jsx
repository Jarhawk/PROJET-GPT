import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function TacheForm({ task }) {
  const { addTask, updateTask } = useTasks();
  const { users, fetchUsers } = useUsers();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titre: task?.titre || "",
    description: task?.description || "",
    type: task?.type || "unique",
    date_debut: task?.date_debut || "",
    date_fin: task?.date_fin || "",
    next_echeance: task?.next_echeance || "",
    assigned_to: task?.assigned_to || "",
    statut: task?.statut || "a_faire",
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchUsers({ actif: true });
  }, [fetchUsers]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setLoading(true);
    try {
      if (task) {
        await updateTask(task.id, form);
        toast.success("Tâche mise à jour !");
      } else {
        await addTask(form);
        toast.success("Tâche ajoutée !");
      }
      navigate("/taches");
    } catch (err) {
      console.error("Erreur enregistrement tâche:", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 max-w-md">
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
        <span>Type</span>
        <select
          className="input w-full"
          name="type"
          value={form.type}
          onChange={handleChange}
        >
          <option value="unique">Unique</option>
          <option value="quotidienne">Quotidienne</option>
          <option value="hebdomadaire">Hebdomadaire</option>
          <option value="mensuelle">Mensuelle</option>
        </select>
      </label>
      <label className="block">
        <span>Date début</span>
        <input
          className="input w-full"
          type="date"
          name="date_debut"
          value={form.date_debut}
          onChange={handleChange}
          required
        />
      </label>
      <label className="block">
        <span>Date fin</span>
        <input
          className="input w-full"
          type="date"
          name="date_fin"
          value={form.date_fin}
          onChange={handleChange}
        />
      </label>
      <label className="block">
        <span>Prochaine échéance</span>
        <input
          className="input w-full"
          type="date"
          name="next_echeance"
          value={form.next_echeance}
          onChange={handleChange}
        />
      </label>
      <label className="block">
        <span>Assignée à</span>
        <select
          className="input w-full"
          name="assigned_to"
          value={form.assigned_to}
          onChange={handleChange}
        >
          <option value="">--</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
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
          <option value="fait">Fait</option>
          <option value="reporte">Reporté</option>
          <option value="annule">Annulé</option>
        </select>
      </label>
      <Button type="submit" disabled={loading} className="mt-2">
        {task ? "Mettre à jour" : "Ajouter"}
      </Button>
    </form>
  );
}
