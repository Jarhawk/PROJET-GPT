export function mapDbLineToUI(row: any) {
  const qte = Number(row.quantite ?? 0);
  const pu = Number(row.pu_ht ?? row.prix_unitaire_ht ?? row.pu ?? 0);
  const total_ht = Number(row.total_ht ?? row.montant_ht ?? qte * pu);
  const tva = Number(row.tva ?? row.produit?.tva ?? 0);
  const tva_montant = Number(row.tva_montant ?? (total_ht * tva) / 100);
  const total_ttc = Number(row.total_ttc ?? row.montant_ttc ?? total_ht + tva_montant);
  const puCalcule = qte > 0 ? total_ht / qte : 0;
  return {
    id: row.id,
    produit_id: row.produit_id,
    produit_nom: row.produit?.nom ?? row.produit_nom ?? '',
    quantite: qte,
    unite: row.produit?.unite?.nom ?? row.produit?.unite ?? row.unite ?? '',
    total_ht,
    prix_total_ht: total_ht,
    pu_ht: puCalcule,
    prix_unitaire_ht: puCalcule,
    pmp: Number(row.produit?.pmp ?? row.pmp ?? 0),
    tva,
    tva_montant,
    total_ttc,
    zone_id: row.zone_id ?? null,
  };
}

export function mapUILineToPayload(l: any) {
  return {
    produit_id: l.produit_id,
    quantite: Number(l.quantite || 0),
    pmp: Number(l.pmp || 0),
    pu_ht: Number(l.pu_ht || 0),
    tva: Number(l.tva || 0),
    total_ht: Number(l.total_ht || 0),
    total_ttc: Number(l.total_ttc || 0),
    zone_id: l.zone_id ?? null,
  };
}
