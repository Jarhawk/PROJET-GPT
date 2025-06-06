import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useFiches } from "@/hooks/useFiches";
import { toast } from "react-toastify";

export default function MenuForm({ onSuccess }) {
  const [nom, setNom] = useState("");
  const [date, setDate] = useState("");
  const [selectedFiches, setSelectedFiches] = useState([]);
  const { getFiches } = useFiches();
  const [fiches, setFiches] = useState([]);

  useEffect(() => {
    getFiches().then(setFiches);
  }, []);

  const handleSubmit = async () => {
    if (!nom || !date || selectedFiches.length === 0) {
      toast.error("Tous les champs sont obligatoires.");
      return;
    }

    const { error } = await supabase.from("menus").insert({
      nom,
      date,
      fiches: selectedFiches,
    });

    if (error) {
      console.error(error);
      toast.error("Erreur lors de la création du menu.");
    } else {
      toast.success("Menu du jour enregistré !");
      setNom("");
      setDate("");
      setSelectedFiches([]);
      if (onSuccess) onSuccess();
    }
  };

  const toggleFiche = (ficheId) => {
    if (selectedFiches.includes(ficheId)) {
      setSelectedFiches(selectedFiches.filter((id) => id !== ficheId));
    } else {
      setSelectedFiches([...selectedFiches, ficheId]);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-2xl font-bold mb-4 text-mamastock-gold">Créer un menu du jour</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Nom du menu"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="font-semibold">Sélectionner les fiches à associer :</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto border rounded p-2">
          {fiches.map((fiche) => (
            <label
              key={fiche.id}
              className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer border hover:shadow-sm transition
                ${selectedFiches.includes(fiche.id) ? "bg-mamastock-gold text-white" : "bg-gray-50"}`}
            >
              <input
                type="checkbox"
                checked={selectedFiches.includes(fiche.id)}
                onChange={() => toggleFiche(fiche.id)}
              />
              <div>
                <div className="font-semibold">{fiche.nom}</div>
                <div className="text-xs italic">
                  Type : {fiche.type} | Catégorie : {fiche.categorie}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-mamastock-gold text-white px-4 py-2 rounded font-semibold"
      >
        ✅ Enregistrer le menu
      </button>
    </div>
  );
}
