export interface RequisitionLine {
  id: string;
  produit_id: string;
  unite: string | null;
  quantite: number;
}

export interface Requisition {
  id: string;
  date_requisition: string;
  statut: string;
  zone_id: string | null;
  mama_id: string;
  lignes: RequisitionLine[];
  commentaire?: string;
}

export interface VRequisition {
  id: string;
  date_requisition: string;
  quantite: number;
  mama_id: string;
  produit_id: string;
  produit_nom: string;
  photo_url: string | null;
}
