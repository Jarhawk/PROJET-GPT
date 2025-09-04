import fs from 'fs';
import { supa } from './lib/supa.js';
import { toNumberFR, fmtEUR, fmtPct } from './lib/numFR.js';

async function runScenario(name, fn, results) {
  const entry = { status: '❌', detail: '' };
  try {
    if (!supa) throw new Error('Supabase client not configured');
    entry.detail = await fn();
    entry.status = '✅';
  } catch (err) {
    entry.detail = err.message;
  }
  results.push(`${entry.status} ${name}${entry.detail ? ' - ' + entry.detail : ''}`);
}

async function scenarioProduits() {
  const produit = {
    nom: 'QA Produit',
    unite_id: 1,
    zone_stock_id: 1,
    tva: 20,
    actif: true,
    mama_id: 'qa'
  };
  const { data: inserted, error: insertError } = await supa
    .from('produits')
    .insert(produit)
    .select('id, nom');
  if (insertError) throw insertError;
  const prodId = inserted[0].id;
  const { error: updateError } = await supa
    .from('produits')
    .update({ nom: 'QA Produit Mod', tva: 10 })
    .eq('id', prodId);
  if (updateError) throw updateError;
  const { error: deleteError } = await supa
    .from('produits')
    .delete()
    .eq('id', prodId);
  if (deleteError) throw deleteError;
  return `id=${prodId}`;
}

async function scenarioFactures() {
  const fournisseur = {
    nom: 'QA Fournisseur',
    actif: true,
    mama_id: 'qa'
  };
  const { data: fInsert, error: fErr } = await supa
    .from('fournisseurs')
    .insert(fournisseur)
    .select('id');
  if (fErr) throw fErr;
  const fournisseurId = fInsert[0].id;

  const unite = { nom: 'uqa', mama_id: 'qa' };
  const { data: uInsert, error: uErr } = await supa
    .from('unites')
    .insert(unite)
    .select('id');
  if (uErr) throw uErr;
  const uniteId = uInsert[0].id;

  const zone = { nom: 'Zone QA', mama_id: 'qa' };
  const { data: zInsert, error: zErr } = await supa
    .from('zones_stock')
    .insert(zone)
    .select('id');
  if (zErr) throw zErr;
  const zoneId = zInsert[0].id;

  const produit = {
    nom: 'Prod facture QA',
    unite_id: uniteId,
    zone_stock_id: zoneId,
    tva: 20,
    actif: true,
    mama_id: 'qa'
  };
  const { data: pInsert, error: pErr } = await supa
    .from('produits')
    .insert(produit)
    .select('id');
  if (pErr) throw pErr;
  const prodId = pInsert[0].id;

  const quantite = toNumberFR('1,25');
  const totalHT = toNumberFR('9,25');
  const puHT = Math.round((totalHT / quantite) * 100) / 100;

  const facture = {
    fournisseur_id: fournisseurId,
    date_facture: new Date().toISOString().slice(0, 10),
    numero: 'F-QA',
    statut: 'brouillon',
    total_ht: totalHT,
    mama_id: 'qa'
  };
  const { data: faInsert, error: faErr } = await supa
    .from('factures')
    .insert(facture)
    .select('id');
  if (faErr) throw faErr;
  const factureId = faInsert[0].id;

  const ligne = {
    facture_id: factureId,
    produit_id: prodId,
    quantite,
    total_ht: totalHT,
    prix_unitaire: puHT,
    tva: 20,
    zone_id: zoneId,
    mama_id: 'qa'
  };
  const { error: lErr } = await supa
    .from('facture_lignes')
    .insert(ligne);
  if (lErr) throw lErr;

  const { data: reread, error: rErr } = await supa
    .from('factures')
    .select(
      'id, numero, total_attendu_ht:total_ht, statut, lignes:facture_lignes(id, produit_id, quantite, total_ht, tva, zone_stock_id:zone_id)'
    )
    .eq('id', factureId)
    .single();
  if (rErr) throw rErr;

  const { error: upErr } = await supa
    .from('factures')
    .update({ statut: 'validee' })
    .eq('id', factureId);
  if (upErr) throw upErr;

  await supa.from('facture_lignes').delete().eq('facture_id', factureId);
  await supa.from('factures').delete().eq('id', factureId);
  await supa.from('produits').delete().eq('id', prodId);
  await supa.from('zones_stock').delete().eq('id', zoneId);
  await supa.from('unites').delete().eq('id', uniteId);
  await supa.from('fournisseurs').delete().eq('id', fournisseurId);

  return `id=${factureId}`;
}

async function scenarioFichesTechniques() {
  const produit = {
    nom: 'Prod fiche QA',
    unite_id: 1,
    zone_stock_id: 1,
    tva: 20,
    actif: true,
    mama_id: 'qa'
  };
  const { data: pInsert, error: pErr } = await supa
    .from('produits')
    .insert(produit)
    .select('id');
  if (pErr) throw pErr;
  const prodId = pInsert[0].id;

  const fiche = {
    titre: 'Fiche QA',
    portions: 2,
    actif: true,
    mama_id: 'qa'
  };
  const { data: fInsert, error: fErr } = await supa
    .from('fiches')
    .insert(fiche)
    .select('id');
  if (fErr) throw fErr;
  const ficheId = fInsert[0].id;

  const quantite = toNumberFR('2,5');
  const prixVente = toNumberFR('10');
  const pmpResp = await supa
    .from('v_pmp')
    .select('pmp')
    .eq('produit_id', prodId)
    .single();
  const pmp = pmpResp.data?.pmp || 0;
  const coutTotal = quantite * pmp;
  const coutPortion = coutTotal / fiche.portions;

  const ficheTech = {
    fiche_id: ficheId,
    nom: 'Fiche QA',
    type_carte: 'nourriture',
    famille: 'QA',
    portions: fiche.portions,
    prix_vente: prixVente,
    carte_actuelle: true,
    cout_total: coutTotal,
    cout_portion: coutPortion,
    rendement: 1,
    actif: true,
    mama_id: 'qa'
  };
  const { data: ftInsert, error: ftErr } = await supa
    .from('fiches_techniques')
    .insert(ficheTech)
    .select('id');
  if (ftErr) throw ftErr;
  const ficheTechId = ftInsert[0].id;

  const ligne = {
    fiche_id: ficheId,
    produit_id: prodId,
    quantite,
    mama_id: 'qa'
  };
  const { error: lErr } = await supa
    .from('fiche_lignes')
    .insert(ligne);
  if (lErr) throw lErr;

  const { data: reread, error: rErr } = await supa
    .from('fiches_techniques')
    .select(
      'id, nom, type_carte, prix_vente, cout_portion, lignes:fiche_lignes(produit_id, quantite)'
    )
    .eq('id', ficheTechId)
    .single();
  if (rErr) throw rErr;

  await supa.from('fiche_lignes').delete().eq('fiche_id', ficheId);
  await supa.from('fiches_techniques').delete().eq('id', ficheTechId);
  await supa.from('fiches').delete().eq('id', ficheId);
  await supa.from('produits').delete().eq('id', prodId);

  const fc = prixVente ? coutPortion / prixVente : 0;
  return `id=${ficheTechId} coût=${fmtEUR(coutPortion)} foodCost=${fmtPct(fc)}`;
}

async function scenarioParametrage() {
  const famille = { nom: 'Fam QA', actif: true, mama_id: 'qa' };
  const { data: famInsert, error: famErr } = await supa
    .from('familles')
    .insert(famille)
    .select('id');
  if (famErr) throw famErr;
  const familleId = famInsert[0].id;

  const { error: famUpdErr } = await supa
    .from('familles')
    .update({ nom: 'Fam QA Mod' })
    .eq('id', familleId);
  if (famUpdErr) throw famUpdErr;

  const { data: famRead, error: famReadErr } = await supa
    .from('familles')
    .select('id, nom')
    .eq('id', familleId)
    .single();
  if (famReadErr) throw famReadErr;

  const sousFam = { nom: 'Sous QA', famille_id: familleId, actif: true, mama_id: 'qa' };
  const { data: sfInsert, error: sfErr } = await supa
    .from('sous_familles')
    .insert(sousFam)
    .select('id');
  if (sfErr) throw sfErr;
  const sousFamId = sfInsert[0].id;

  const { error: sfUpdErr } = await supa
    .from('sous_familles')
    .update({ nom: 'Sous QA Mod' })
    .eq('id', sousFamId);
  if (sfUpdErr) throw sfUpdErr;

  const unite = { nom: 'Unit QA', actif: true, mama_id: 'qa' };
  const { data: uInsert, error: uErr } = await supa
    .from('unites')
    .insert(unite)
    .select('id');
  if (uErr) throw uErr;
  const uniteId = uInsert[0].id;

  const zone = { nom: 'Zone QA', actif: true, mama_id: 'qa' };
  const { data: zInsert, error: zErr } = await supa
    .from('zones_stock')
    .insert(zone)
    .select('id');
  if (zErr) throw zErr;
  const zoneId = zInsert[0].id;

  await supa.from('zones_stock').delete().eq('id', zoneId);
  await supa.from('unites').delete().eq('id', uniteId);
  await supa.from('sous_familles').delete().eq('id', sousFamId);
  await supa.from('familles').delete().eq('id', familleId);

  return `famille=${familleId} sous_famille=${sousFamId} unite=${uniteId} zone=${zoneId}`;
}

async function scenarioFournisseurs() {
  const fournisseur = { nom: 'Fourn QA', actif: true, mama_id: 'qa' };
  const { data: insert, error: insErr } = await supa
    .from('fournisseurs')
    .insert(fournisseur)
    .select('id');
  if (insErr) throw insErr;
  const id = insert[0].id;

  const { data: list, error: listErr } = await supa
    .from('fournisseurs')
    .select('id, nom')
    .ilike('nom', '%Fourn QA%');
  if (listErr) throw listErr;
  if (!list.some(f => f.id === id)) throw new Error('lecture échouée');

  const { error: updErr } = await supa
    .from('fournisseurs')
    .update({ nom: 'Fourn QA Mod' })
    .eq('id', id);
  if (updErr) throw updErr;

  const { data: reread, error: rereadErr } = await supa
    .from('fournisseurs')
    .select('id, nom')
    .eq('id', id)
    .single();
  if (rereadErr) throw rereadErr;

  const { error: delErr } = await supa
    .from('fournisseurs')
    .delete()
    .eq('id', id);
  if (delErr) throw delErr;

  const { data: afterDel, error: afterDelErr } = await supa
    .from('fournisseurs')
    .select('id')
    .eq('id', id);
  if (afterDelErr) throw afterDelErr;
  if (afterDel.length !== 0) throw new Error('suppression échouée');

  return `id=${id}`;
}

async function scenarioTaches() {
  const user = { nom: 'User QA', mama_id: 'qa' };
  const { data: uInsert, error: uErr } = await supa
    .from('utilisateurs')
    .insert(user)
    .select('id');
  if (uErr) throw uErr;
  const userId = uInsert[0].id;

  const tache = {
    titre: 'Tâche QA',
    description: 'Test',
    utilisateur_id: userId,
    date_echeance: new Date().toISOString().slice(0, 10),
    statut: 'a_faire',
    mama_id: 'qa'
  };
  const { data: tInsert, error: tErr } = await supa
    .from('taches')
    .insert(tache)
    .select('id');
  if (tErr) throw tErr;
  const tacheId = tInsert[0].id;

  const { data: reread, error: rErr } = await supa
    .from('taches')
    .select('id, titre, statut')
    .eq('id', tacheId)
    .single();
  if (rErr) throw rErr;

  const { error: updErr } = await supa
    .from('taches')
    .update({ statut: 'terminee' })
    .eq('id', tacheId);
  if (updErr) throw updErr;

  const { error: delErr } = await supa
    .from('taches')
    .delete()
    .eq('id', tacheId);
  if (delErr) throw delErr;

  const { data: afterDel, error: afterErr } = await supa
    .from('taches')
    .select('id')
    .eq('id', tacheId);
  if (afterErr) throw afterErr;
  if (afterDel.length !== 0) throw new Error('suppression échouée');

  await supa.from('utilisateurs').delete().eq('id', userId);

  return `id=${tacheId}`;
}

async function main() {
  const results = [];
  await runScenario('Produits CRUD', scenarioProduits, results);
  await runScenario('Factures CRUD', scenarioFactures, results);
  await runScenario('Fiches techniques CRUD', scenarioFichesTechniques, results);
  await runScenario('Paramétrage', scenarioParametrage, results);
  await runScenario('Fournisseurs CRUD', scenarioFournisseurs, results);
  await runScenario('Tâches CRUD', scenarioTaches, results);
  const pages = [
    'Menus',
    'Inventaire',
    'Stock',
    'Dashboard',
    'Sécurité accès',
    'Formats & i18n'
  ];
  for (const p of pages) {
    results.push(`⚠️ ${p} - scénario non implémenté`);
  }
  const reportPath = new URL('./report.md', import.meta.url);
  fs.writeFileSync(reportPath, results.join('\n') + '\n');
  console.log(results.join('\n'));
}

main();
