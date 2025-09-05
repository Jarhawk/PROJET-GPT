export type MamaSettings = {
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  email_envoi: string | null;
  email_alertes: string | null;
  dark_mode: boolean | null;
  langue: 'fr' | 'en' | string | null;
  monnaie: 'EUR' | 'USD' | string | null;
  timezone: string | null;
  rgpd_text: string | null;
  mentions_legales: string | null;
};

export type Fournisseur = { id: string; nom: string; actif: boolean };
export type FournisseurContact = {
  id: string;
  fournisseur_id: string;
  nom: string | null;
  email: string | null;
  tel: string | null;
};
