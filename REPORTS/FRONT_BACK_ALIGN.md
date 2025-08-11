# Front / Back Alignment

## Missing
### Tables
- requisitions!inner
- utilisateur:utilisateurs!logs_securite_utilisateur_id_fkey
- fournisseur:fournisseur_id
- produit:produit_id
- lignes:lignes_bl!bl_id
- lignes:commande_lignes
- unite:unite_id
- gadgets:gadgets!tableau_id
- famille:familles!fk_produits_famille
- sous_famille:sous_familles!fk_produits_sous_famille
- liaisons:fournisseur_produits!fournisseur_produits_produit_id_fkey
- fournisseur:fournisseurs!fk_fournisseur_produits_fournisseur_id
- lignes:produits_inventaire!inventaire_id
- fournisseur_produits:fournisseur_produits!fournisseur_produits_produit_id_fkey
- lignes:facture_lignes!facture_id
- factures:facture_id
- famille:familles!fiches_techniques_famille_id_fkey
- lignes:fiche_lignes!fiche_id
- lignes:v_fiche_lignes_complete!fiche_id
- sous_fiche:sous_fiche_id
- contact:fournisseur_contacts
- zones_stock
- zone:inventaire_zones!inventaires_zone_id_fkey
- produit:produits!produits_inventaire_produit_id_fkey
- produit:produits!facture_lignes_produit_id_fkey
- famille:familles
- utilisateurs:user_id
- mamas
- fiches:menus_jour_fiches
- fiche:fiches_techniques
- resume:v_menu_groupe_resume
- fiches:menu_fiches
- fiche: fiches
- mouvements_centres_cout
- centres_de_cout:cost_center_id
- lignes:planning_lignes!planning_id
- main_fournisseur:fournisseur_id
- produit:produits!fournisseur_produits_produit_id_fkey
- lignes:requisition_lignes
- lignes:requisition_lignes!requisition_id
- assigned:utilisateurs!taches_assigned_to_fkey
- zone_source:zones_stock!fk_transferts_zone_source_id
- zone_destination:zones_stock!fk_transferts_zone_dest_id
- lignes:transfert_lignes
- produit:produits
- utilisateurs_complets
- zones_droits!inner

### Views
- v_achats_mensuels
- v_costing_carte
- v_menu_du_jour_lignes_cout

### Columns
- promotions: *
- logs_securite: utilisateur_id, description, count:id
- taches: titre, date_echeance, *
- achats: *
- help_articles: *
- regles_alertes: *
- api_keys: *
- bons_livraison: numero_bl, date_reception, commentaire, actif, fournisseur_id, *
- fiches_techniques: *, nom, cout_par_portion, actif, cout_total
- commandes: *
- fournisseur_produits: *, derniere_livraison:date_livraison
- consentements_utilisateur: *
- centres_de_cout: *
- tableaux_de_bord: *, liste_gadgets_json
- gadgets: ordre
- documents: *, fichier_url, url
- produits: sous_famille_id, *, tva, dernier_prix
- inventaires: *, date
- factures: *, numero, date_facture, fournisseur_id, total_ttc, statut
- facture_lignes: quantite, prix, tva, facture_id, prix_unitaire, *
- compta_mapping: cle, compte
- familles: *
- sous_familles: *
- feedback: *
- fiche_cout_history: *
- fournisseurs_api_config: *
- fournisseur_notes: *
- fournisseurs: actif
- produits_inventaire: *
- inventaire_zones: *
- logs_activite: *
- rapports_generes: *
- menus_jour: *, date, categorie, fiche_id, portions
- menu_groupes: *
- menu_groupe_lignes: *
- menu_groupe_modele_lignes: *
- menus: *
- notifications: *
- notification_preferences: *
- etapes_onboarding: etape, statut
- periodes_comptables: *
- permissions: *
- pertes: *
- planning_previsionnel: *
- requisitions: *
- roles: *
- alertes_rupture: *
- signalements: *
- templates_commandes: *
- transferts: date_transfert, motif
- auth_double_facteur: enabled, secret
- usage_stats: module, count:id, timestamp
- validation_requests: *
- v_produits_par_zone: *
- zones_droits: *

### Functions
- advanced_stats
- suggest_cost_centers
- merge_familles
- reorder_familles
- log_action

## Mismatch
### Foreign Keys
- templates_commandes(mama_id) -> mamas(id)
- inventaires(mama_id) -> mamas(id)
- produits_inventaire(mama_id) -> mamas(id)
- periodes_comptables(mama_id) -> mamas(id)
- requisitions(mama_id) -> mamas(id)
- requisitions(zone_id) -> zones_stock(id)
- menu_groupe_lignes(menu_groupe_id) -> menu_groupes(id)
- menu_groupe_modeles(mama_id) -> mamas(id)
- settings(mama_id) -> mamas(id)
- user_mama_access(mama_id) -> mamas(id)

### Policies

### Views

## Unused
### Tables
- emails_envoyes
- alertes
- documentation
- fiches
- groupes
- guides_seen
- menus_groupes
- menus_groupes_fiches
- parametres_commandes
- stocks
- tooltips
- ventes_boissons
- ventes_fiches_carte

### Views
- v_boissons
- suggestions_commandes
- v_couts_fiches

### Functions
- current_user_mama_id
- current_user_is_admin_or_manager
- current_user_is_admin
- calcul_ecarts_inventaire
- can_transfer
- zone_is_cave_or_shop
- compare_fiche
- stats_multi_mamas
- sync_pivot_from_produits
- sync_produits_from_pivot
- safe_delete_zone
