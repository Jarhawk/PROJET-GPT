import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function Taches() {
  const { tasks, loading, error, fetchTasks, deleteTask } = useTasks();
  const { mama_id, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && mama_id) fetchTasks();
  }, [authLoading, mama_id, fetchTasks]);

  const handleDelete = async id => {
    if (window.confirm("Supprimer cette tâche ?")) {
      await deleteTask(id);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tâches</h1>
        <Link to="/taches/nouveau" className="bg-white/10 backdrop-blur-lg text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-lg">
          Nouvelle tâche
        </Link>
      </div>
      <table className="w-full text-sm bg-white/5 backdrop-blur-lg shadow rounded text-white">
        <thead>
          <tr>
            <th className="px-2 py-1">Titre</th>
            <th className="px-2 py-1">Type</th>
            <th className="px-2 py-1">Prochaine échéance</th>
            <th className="px-2 py-1">Assignée à</th>
            <th className="px-2 py-1">Statut</th>
            <th className="px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-2 py-4 text-center text-gray-500">
                Aucune tâche pour le moment
              </td>
            </tr>
          ) : (
            tasks.map(t => (
              <tr key={t.id}>
                <td className="px-2 py-1">
                  <Link to={`/taches/${t.id}`} className="underline text-white">
                    {t.titre}
                  </Link>
                </td>
                <td className="px-2 py-1">{t.type}</td>
                <td className="px-2 py-1">{t.next_echeance || ""}</td>
                <td className="px-2 py-1">{t.assigned?.email || "-"}</td>
                <td className="px-2 py-1">{t.statut}</td>
                <td className="px-2 py-1 text-right">
                  <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
