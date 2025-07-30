// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function buildPriceData(historique = []) {
  const fournisseurs = {};
  const dates = new Set();
  historique.forEach(h => {
    const date = h.derniere_livraison?.slice(0, 10) || h.created_at?.slice(0, 10);
    if (!date) return;
    const key = h.fournisseur?.nom || '';
    if (!fournisseurs[key]) fournisseurs[key] = {};
    fournisseurs[key][date] = h.prix_achat;
    dates.add(date);
  });
  const sorted = Array.from(dates).sort();
  return sorted.map(d => {
    const row = { date: d };
    Object.keys(fournisseurs).forEach(s => { row[s] = fournisseurs[s][d] ?? null; });
    return row;
  });
}
