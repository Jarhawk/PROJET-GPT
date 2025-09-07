import { invoke } from '@tauri-apps/api/core';

export async function getDb() {
  return null;
}

export async function closeDb() {
  try {
    await invoke('close_db');
  } catch {}
}

export async function produits_list(params: any = {}) {
  return invoke('produits_list', params);
}

export async function produits_create(produit: any) {
  return invoke('produits_create', { produit });
}

export async function produits_update(id: string, fields: any) {
  return invoke('produits_update', { id, fields });
}

export async function produits_get(id: string) {
  return invoke('produits_get', { id });
}

export async function produits_prices(produit_id: string) {
  return invoke('produits_prices', { produit_id });
}

export async function fournisseurs_list(params: any = {}) {
  return invoke('fournisseurs_list', params);
}

export async function fournisseurs_create(fournisseur: any) {
  return invoke('fournisseurs_create', { fournisseur });
}

export async function fournisseurs_update(id: string, mama_id: string, fields: any) {
  return invoke('fournisseurs_update', { id, mama_id, fields });
}

export async function facture_create_with_lignes(facture: any, lignes: any[]) {
  return invoke('facture_create_with_lignes', { facture, lignes });
}
