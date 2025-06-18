import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import TacheForm from "@/components/taches/TacheForm";

export default function TacheDetail() {
  const { id } = useParams();
  const { fetchTaskById } = useTasks();
  const [task, setTask] = useState(null);

  useEffect(() => {
    fetchTaskById(id).then(setTask);
  }, [fetchTaskById, id]);

  if (!task) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Modifier la tâche</h1>
      <TacheForm task={task} />
    </div>
  );
}
