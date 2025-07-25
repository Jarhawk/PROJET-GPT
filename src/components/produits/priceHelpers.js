// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function buildPriceData(historique = []) {
  const fournisseurs = {}; // ✅ Correction Codex
  const dates = new Set();
  historique.forEach(h => {
    const date = h.derniere_livraison?.slice(0, 10) || h.created_at?.slice(0, 10);
    if (!date) return;
    const key = h.fournisseur?.nom || ''; // ✅ Correction Codex
    if (!fournisseurs[key]) fournisseurs[key] = {}; // ✅ Correction Codex
    fournisseurs[key][date] = h.prix_achat; // ✅ Correction Codex
    dates.add(date);
  });
  const sorted = Array.from(dates).sort();
  return sorted.map(d => {
    const row = { date: d };
    Object.keys(fournisseurs).forEach(s => { row[s] = fournisseurs[s][d] ?? null; }); // ✅ Correction Codex
    return row;
  });
}
