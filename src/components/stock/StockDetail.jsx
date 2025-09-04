import React from "react";

export function buildRotationData(mvts) {
  const byMonth = {};
  mvts.forEach((m) => {
    if (m.type && m.type.toLowerCase() === "sortie") {
      const mois = m.date.slice(0, 7);
      byMonth[mois] = (byMonth[mois] || 0) + m.quantite;
    }
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, q]) => ({ mois, q }));
}

export default function StockDetail() {
  return null;
}
