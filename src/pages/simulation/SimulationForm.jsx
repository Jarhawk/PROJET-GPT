import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SimulationForm({ addRecipe, setPrix }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [prix, setPrixLocal] = useState("");

  useEffect(() => {
    supabase.from("recipes").select("*").then(({ data }) => setRecipes(data || []));
  }, []);

  const handleAdd = () => {
    const recette = recipes.find(r => r.id === selectedId);
    if (recette) {
      addRecipe(recette);
      setPrix(""); setSelectedId("");
    }
  };

  return (
    <div className="flex flex-col gap-2 max-w-md">
      <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="border px-2 py-1">
        <option value="">Sélectionner une fiche</option>
        {recipes.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
      </select>
      <input type="number" value={prix} onChange={(e) => {
        setPrixLocal(e.target.value);
        setPrix(selectedId, parseFloat(e.target.value));
      }} placeholder="Prix de vente TTC (€)" className="border px-2 py-1" />
      <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-1 rounded">Ajouter</button>
    </div>
  );
}