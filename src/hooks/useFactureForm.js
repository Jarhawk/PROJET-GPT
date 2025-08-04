// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMemo } from "react";

export function useFactureForm(lignes = []) {
  const autoHt = useMemo(
    () => lignes.reduce((s, l) => s + (Number(l.total_ht) || 0), 0),
    [lignes],
  );

  const autoTva = useMemo(
    () =>
      lignes.reduce(
        (s, l) =>
          s + (Number(l.total_ht) || 0) * (Number(l.tva) || 0) / 100,
        0,
      ),
    [lignes],
  );

  const autoTotal = useMemo(() => autoHt + autoTva, [autoHt, autoTva]);

  return { autoHt, autoTva, autoTotal };
}
