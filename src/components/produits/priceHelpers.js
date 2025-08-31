// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function buildPriceData(historique = []) {
  const entries = Array.isArray(historique) ? historique : [];
  const fournisseurs = {};
  const dates = new Set();
  for (const h of entries) {
    const date = h.derniere_livraison?.slice(0, 10) || h.created_at?.slice(0, 10);
    if (!date) continue;
    const key = h.fournisseur?.nom || '';
    if (!fournisseurs[key]) fournisseurs[key] = {};
    fournisseurs[key][date] = h.prix_achat;
    dates.add(date);
  }
  const sortedDates = Array.from(dates).sort();
  const list = Array.isArray(sortedDates) ? sortedDates : [];
  const rows = [];
  for (const d of list) {
    const row = { date: d };
    for (const s of Object.keys(fournisseurs)) {
      row[s] = fournisseurs[s][d] ?? null;
    }
    rows.push(row);
  }
  return rows;
}
