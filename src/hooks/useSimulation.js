// src/hooks/useSimulation.js
import { useState } from "react";

export const useSimulation = () => {
  const [selection, setSelection] = useState([]);

  const addRecipe = (recette) => {
    if (!selection.find((r) => r.id === recette.id)) {
      setSelection([...selection, { ...recette, prix: 0 }]);
    }
  };

  const removeRecipe = (id) => {
    setSelection((prev) => prev.filter((r) => r.id !== id));
  };

  const setPrix = (id, prix) => {
    setSelection((prev) =>
      prev.map((r) => (r.id === id ? { ...r, prix: parseFloat(prix) || 0 } : r))
    );
  };

  const totalCout = selection.reduce((acc, r) => acc + (r.cout_total || 0), 0);
  const totalPrix = selection.reduce((acc, r) => acc + (r.prix || 0), 0);
  const marge = totalPrix - totalCout;
  const margePourcent = totalPrix > 0 ? ((marge / totalPrix) * 100).toFixed(1) : 0;

  const details = selection.map((r) => ({
    nom: r.nom,
    cout: r.cout_total || 0,
    prix: r.prix || 0,
    portions: r.portions || 1,
    coutParPortion: r.portions ? (r.cout_total || 0) / r.portions : 0,
  }));

  return {
    selection,
    addRecipe,
    removeRecipe,
    setPrix,
    results: {
      totalCout,
      totalPrix,
      marge,
      margePourcent,
      details,
    },
  };
};

export default useSimulation;
