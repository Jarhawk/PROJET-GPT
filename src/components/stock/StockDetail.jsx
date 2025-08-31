import React from "react";

export function buildRotationData(mvts) {
  const array = Array.isArray(mvts) ? mvts : [];
  const byMonth = {};
  for (const m of array) {
    if (m.type && m.type.toLowerCase() === "sortie") {
      const mois = m.date.slice(0, 7);
      byMonth[mois] = (byMonth[mois] || 0) + m.quantite;
    }
  }
  const result = [];
  const entries = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  for (const [mois, q] of entries) {
    result.push({ mois, q });
  }
  return result;
}

export default function StockDetail() {
  return null;
}
