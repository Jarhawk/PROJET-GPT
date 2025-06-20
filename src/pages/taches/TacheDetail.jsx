import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import TacheForm from "@/components/taches/TacheForm";

export default function TacheDetail() {
  const { id } = useParams();
  const { fetchTaskById } = useTasks();
  const { mama_id, loading: authLoading } = useAuth();
  const [task, setTask] = useState(null);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchTaskById(id).then(setTask);
    }
  }, [authLoading, mama_id, fetchTaskById, id]);

  if (!task) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Modifier la tâche</h1>
      <TacheForm task={task} />
    </div>
  );
}
