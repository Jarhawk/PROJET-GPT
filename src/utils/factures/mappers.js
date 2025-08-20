/**
 * mapDbLineToUI
 * Convertit une ligne issue de la base (facture_lignes + jointures produit/zone éventuelles)
 * en format attendu par le formulaire UI sans ajouter de données inventées.
 *
 * @param {object} dbLine
 * @param {object|null} produitJoin
 * @returns {object}
 */
export function mapDbLineToUI(dbLine, produitJoin = null) {
  const qte = Number(dbLine?.quantite ?? 0);

  const puDb = dbLine?.prix_unitaire_ht != null ? Number(dbLine.prix_unitaire_ht) : null;
  const mtDb = dbLine?.montant_ht != null ? Number(dbLine.montant_ht) : null;

  const prix_total_ht =
    mtDb != null
      ? mtDb
      : puDb != null && qte > 0
      ? Number((puDb * qte).toFixed(4))
      : 0;

  const prix_unitaire_ht =
    qte > 0
      ? Number((prix_total_ht / qte).toFixed(6))
      : Number((puDb ?? 0).toFixed(6));

  const produit = produitJoin ?? dbLine?.produit ?? null;

  const pmp = produit?.pmp != null ? Number(produit.pmp) : null;

  const uniteLabel =
    produit?.unite_nom ??
    produit?.unite ??
    dbLine?.unite ??
    null;

  const tva =
    dbLine?.tva != null
      ? Number(dbLine.tva)
      : produit?.tva != null
      ? Number(produit.tva)
      : 0;

  const zone_id = dbLine?.zone_id ?? produit?.zone_id ?? null;

  return {
    id: dbLine?.id ?? null,
    produit_id: dbLine?.produit_id ?? null,
    quantite: qte,
    uniteLabel,
    prix_total_ht,
    prix_unitaire_ht,
    pmp,
    tva,
    zone_id,
  };
}
