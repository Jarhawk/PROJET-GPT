export function mapDbLineToUI(row: any) {
  const qte = Number(row.quantite ?? 0);
  const pu = Number(row.prix_unitaire_ht ?? 0);
  const total_ht = Number(row.montant_ht ?? qte * pu);
  return {
    id: row.id,
    produit_id: row.produit_id,
    produit_nom: row.produit?.nom ?? row.produit_nom ?? '',
    qte,
    unite: row.produit?.unite ?? row.unite ?? '',
    total_ht,
    pu_ht: qte > 0 ? total_ht / qte : 0,
    pmp: Number(row.produit?.pmp ?? row.pmp ?? 0),
    tva: Number(row.tva ?? row.produit?.tva ?? 0),
    zone_id: row.zone_id ?? null,
  };
}

export function mapUILineToPayload(l: any) {
  return {
    produit_id: l.produit_id,
    quantite: Number(l.qte || 0),
    prix_unitaire_ht: Number(l.pu_ht || 0),
    tva: Number(l.tva || 0),
    zone_id: l.zone_id ?? null,
  };
}
