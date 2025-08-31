// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from 'sonner';
import GlassCard from "@/components/ui/GlassCard";

export default function TacheForm({ task }) {
  const { addTask, updateTask } = useTasks();
  const { users, fetchUsers } = useUtilisateurs();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titre: task?.titre || "",
    description: task?.description || "",
    date_debut: task?.date_debut || "",
    date_echeance: task?.date_echeance || "",
    assignes: Array.isArray(task?.assignes) ? task.assignes[0] : "",
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
    if (loading) return;
    if (!form.titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        titre: form.titre,
        description: form.description,
        date_debut: form.date_debut,
        date_echeance: form.date_echeance,
        statut: form.statut,
        assignes: form.assignes ? [form.assignes] : [],
      };
      if (task) {
        await updateTask(task.id, payload);
        toast.success("Tâche mise à jour !");
      } else {
        await addTask(payload);
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
    <GlassCard title={task ? "Modifier la tâche" : "Nouvelle tâche"}>
      <form onSubmit={handleSubmit} className="space-y-2 max-w-md">
      <label className="block">
        <span>Titre</span>
        <Input
          className="w-full"
          name="titre"
          value={form.titre}
          onChange={handleChange}
          required
        />
      </label>
      <label className="block">
        <span>Description</span>
        <textarea
          className="form-textarea"
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </label>
      <label className="block">
        <span>Date début</span>
        <Input
          className="w-full"
          type="date"
          name="date_debut"
          value={form.date_debut}
          onChange={handleChange}
          required
        />
      </label>
      <label className="block">
        <span>Date d'échéance</span>
        <Input
          className="w-full"
          type="date"
          name="date_echeance"
          value={form.date_echeance}
          onChange={handleChange}
        />
      </label>
      <label className="block">
        <span>Assignée à</span>
        <Select
          className="w-full"
          name="assignes"
          value={form.assignes}
          onChange={handleChange}
        >
          <option value="">--</option>
          {(() => {
            const opts = [];
            const arr = Array.isArray(users) ? users : [];
            for (const u of arr) {
              opts.push(<option key={u.id} value={u.id}>{u.nom}</option>);
            }
            return opts;
          })()}
        </Select>
      </label>
      <label className="block">
        <span>Statut</span>
        <Select
          className="w-full"
          name="statut"
          value={form.statut}
          onChange={handleChange}
        >
          <option value="a_faire">À faire</option>
          <option value="en_cours">En cours</option>
          <option value="fait">Fait</option>
          <option value="reporte">Reporté</option>
          <option value="annule">Annulé</option>
        </Select>
      </label>
      <PrimaryButton type="submit" disabled={loading} className="mt-2 flex items-center gap-2">
        {loading && <span className="loader-glass" />}
        {task ? "Mettre à jour" : "Ajouter"}
      </PrimaryButton>
      </form>
    </GlassCard>
  );
}
