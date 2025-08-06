// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTaches } from "@/hooks/useTaches";

export default function TacheDetail() {
  const { id } = useParams();
  const { getTache, updateTache } = useTaches();
  const [tache, setTache] = useState(null);

  useEffect(() => {
    getTache(id).then(setTache);
  }, [id, getTache]);

  if (!tache) return <LoadingSpinner message="Chargement..." />;

  const handleDone = async () => {
    await updateTache(id, {
      ...tache,
      assignes: (tache.utilisateurs_taches || []).map(a => a.utilisateur_id),
      statut: "terminee",
    });
    setTache(t => ({ ...t, statut: "terminee" }));
  };

  return (
    <div className="p-6 space-y-4 text-sm">
      <h1 className="text-2xl font-bold">{tache.titre}</h1>
      <p>{tache.description}</p>
      <p>Priorité : {tache.priorite}</p>
      <p>Échéance : {tache.date_echeance}</p>
      <p>Statut : {tache.statut}</p>
      <p>
        Assignés :
        {(tache.utilisateurs_taches || [])
          .map(a => a.utilisateur?.nom)
          .filter(Boolean)
          .join(", ") || " - "}
      </p>
      <Button onClick={handleDone} disabled={tache.statut === "terminee"}>
        Terminer la tâche
      </Button>
      <div>
        <h2 className="font-semibold mt-4">Commentaires</h2>
        <p className="text-gray-500 text-xs">Aucun commentaire</p>
      </div>
      <div>
        <h2 className="font-semibold mt-4">Historique</h2>
        <p className="text-gray-500 text-xs">Historique non disponible</p>
      </div>
    </div>
  );
}
