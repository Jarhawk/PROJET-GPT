// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Reorder } from "framer-motion";
import { useDashboards } from "@/hooks/useDashboards";
import WidgetRenderer from "@/components/dashboard/WidgetRenderer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DashboardBuilder() {
  const {
    dashboards,
    getDashboards,
    createDashboard,
    addWidget,
    updateWidget,
    deleteWidget,
    loading,
  } = useDashboards();
  const [current, setCurrent] = useState(null);
  const [newName, setNewName] = useState("");
  const [ordered, setOrdered] = useState([]);

  useEffect(() => {
    getDashboards();
  }, [getDashboards]);

  useEffect(() => {
    if (current) setOrdered(current.widgets || []);
  }, [current]);

  if (loading && dashboards.length === 0) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!current) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mes tableaux de bord</h1>
        <ul className="mb-6 list-disc pl-6">
          {dashboards.map((d) => (
            <li key={d.id}>
              <button className="underline" onClick={() => setCurrent(d)}>{d.nom}</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Nom du dashboard"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            onClick={async () => {
              const db = await createDashboard(newName);
              if (db) {
                setNewName("");
                setCurrent(db);
              }
            }}
          >
            Créer
          </Button>
        </div>
      </div>
    );
  }

  const saveOrder = async () => {
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].ordre !== i) {
        await updateWidget(current.id, ordered[i].id, { ordre: i });
      }
    }
    const list = await getDashboards();
    const match = list.find((d) => d.id === current.id);
    setCurrent(match || null);
  };

  return (
    <div className="p-6">
      <Button className="mb-4" onClick={() => setCurrent(null)}>
        Retour
      </Button>
      <h2 className="text-xl font-bold mb-4">{current.nom}</h2>
      <Reorder.Group
        axis="y"
        values={ordered}
        onReorder={setOrdered}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        {ordered.map((w) => (
          <Reorder.Item key={w.id} value={w} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 relative">
            <button
              className="absolute top-2 right-2 text-red-600"
              onClick={() => deleteWidget(current.id, w.id)}
            >
              ✕
            </button>
            <WidgetRenderer config={w.config} />
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className="flex gap-2">
        <Button
          onClick={() =>
            addWidget(current.id, {
              type: "indicator",
              label: "Nouvel indicateur",
              value: 0,
              indicatorType: "default",
            })
          }
        >
          Ajouter un widget
        </Button>
        <Button onClick={saveOrder}>Publier le dashboard</Button>
      </div>
    </div>
  );
}
