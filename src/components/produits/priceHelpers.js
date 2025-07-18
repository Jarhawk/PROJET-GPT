// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function buildPriceData(historique = []) {
  const suppliers = {};
  const dates = new Set();
  historique.forEach(h => {
    const date = h.derniere_livraison?.slice(0, 10) || h.created_at?.slice(0, 10);
    if (!date) return;
    const key = h.supplier?.nom || '';
    if (!suppliers[key]) suppliers[key] = {};
    suppliers[key][date] = h.prix_achat;
    dates.add(date);
  });
  const sorted = Array.from(dates).sort();
  return sorted.map(d => {
    const row = { date: d };
    Object.keys(suppliers).forEach(s => { row[s] = suppliers[s][d] ?? null; });
    return row;
  });
}
