// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from "react";
import { useMultiMama } from "@/context/MultiMamaContext";

export function useMamaSwitcher() {
  const { mamas, mamaActif, setMamaActif, loading } = useMultiMama();

  useEffect(() => {
    const stored = localStorage.getItem("mamaActif");
    if (!mamaActif && stored) setMamaActif(stored);
  }, [mamaActif, setMamaActif]);

  function switchMama(id) {
    setMamaActif(id);
  }

  return { mamas, mamaActif, switchMama, loading };
}
