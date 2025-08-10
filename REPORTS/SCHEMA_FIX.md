# Schema Fix Report

## Policies rewritten
- public.mamas:mamas_all
- public.fournisseurs:fournisseurs_all
- public.produits:produits_all
- public.roles:roles_self_mama
- public.roles:roles_insert_mama
- public.roles:roles_update_mama
- public.utilisateurs:utilisateurs_self_mama
- public.utilisateurs:utilisateurs_insert_mama
- public.utilisateurs:utilisateurs_update_mama
- public.commandes:commandes_all
- public.commande_lignes:commande_lignes_all
- public.templates_commandes:templates_commandes_select
- public.templates_commandes:templates_commandes_crud_admin
- public.emails_envoyes:emails_envoyes_all
- public.permissions:permissions_self_mama
- public.permissions:permissions_insert_mama
- public.permissions:permissions_update_mama
- public.consentements_utilisateur:consentements_utilisateur_all
- public.achats:achats_all
- public.alertes:alertes_all
- public.api_keys:api_keys_all
- public.auth_double_facteur:auth_double_facteur_all
- public.bons_livraison:bons_livraison_all
- public.catalogue_updates:catalogue_updates_all
- public.centres_de_cout:centres_de_cout_all
- public.compta_mapping:compta_mapping_all
- public.documentation:documentation_all
- public.documents:documents_all
- public.etapes_onboarding:etapes_onboarding_all
- public.facture_lignes:facture_lignes_all
- public.factures:factures_all
- public.familles:familles_all
- public.feedback:feedback_all
- public.fiche_cout_history:fiche_cout_history_all
- public.fiche_lignes:fiche_lignes_all
- public.fiches:fiches_all
- public.fiches_techniques:fiches_techniques_all
- public.fournisseur_contacts:fournisseur_contacts_all
- public.fournisseur_notes:fournisseur_notes_all
- public.fournisseur_produits:fournisseur_produits_all
- public.fournisseurs_api_config:fournisseurs_api_config_all
- public.gadgets:gadgets_all
- public.groupes:groupes_all
- public.guides_seen:guides_seen_all
- public.help_articles:help_articles_all
- public.inventaire_zones:inventaire_zones_all
- public.inventaires:inventaires_select
- public.inventaires:inventaires_update
- public.inventaires:inventaires_delete
- public.inventaires:inventaire_insert
- public.produits_inventaire:produits_inventaire_rls
- public.journaux_utilisateur:journaux_utilisateur_all
- public.lignes_bl:lignes_bl_all
- public.logs_securite:logs_securite_all
- public.menu_fiches:menu_fiches_all
- public.menus:menus_all
- public.menus_groupes:menus_groupes_all
- public.menus_groupes_fiches:menus_groupes_fiches_all
- public.menus_jour:menus_jour_all
- public.menus_jour_fiches:menus_jour_fiches_all
- public.notification_preferences:notification_preferences_all
- public.notifications:notifications_all
- public.parametres_commandes:parametres_commandes_all
- public.periodes_comptables:periodes_comptables_rls
- public.pertes:pertes_all
- public.planning_lignes:planning_lignes_all
- public.planning_previsionnel:planning_previsionnel_all
- public.promotions:promotions_all
- public.regles_alertes:regles_alertes_all
- public.requisitions:requisitions_select
- public.requisitions:requisitions_insert
- public.requisitions:requisitions_update
- public.requisitions:requisitions_delete
- public.requisition_lignes:requisition_lignes_select
- public.requisition_lignes:requisition_lignes_insert
- public.requisition_lignes:requisition_lignes_update
- public.requisition_lignes:requisition_lignes_delete
- public.signalements:signalements_all
- public.sous_familles:sous_familles_all
- public.stocks:stocks_all
- public.tableaux_de_bord:tableaux_de_bord_all
- public.taches:taches_all
- public.tooltips:tooltips_all
- public.transfert_lignes:transfert_lignes_all
- public.transferts:transferts_all
- public.unites:unites_all
- public.usage_stats:usage_stats_all
- public.utilisateurs_taches:utilisateurs_taches_all
- public.validation_requests:validation_requests_all
- public.ventes_boissons:ventes_boissons_all
- public.ventes_fiches_carte:ventes_fiches_carte_all
- public.zones_stock:zones_stock_select
- public.zones_stock:zones_stock_admin_iud
- public.zones_droits:zones_droits_admin_all
- public.menu_groupes:menu_groupes_all
- public.menu_groupe_lignes:menu_groupe_lignes_all
- public.menu_groupe_modeles:menu_groupe_modeles_all
- public.menu_groupe_modele_lignes:menu_groupe_modele_lignes_all
- public.alertes_rupture:alertes_rupture_all
- public.logs_activite:logs_activite_all
- public.menus_jour_lignes:menus_jour_lignes_all
- public.rapports_generes:rapports_generes_all
- public.settings:settings_all
- public.user_mama_access:user_mama_access_select
- public.user_mama_access:user_mama_access_modify
- public.ventes_fiches:ventes_fiches_all
- public.ventes_import_staging:ventes_import_staging_all
- public.produits_zones:pz_select
- public.produits_zones:pz_iud

## Functions aliased/stubbed
- public.current_user_is_admin -> public.current_user_is_admin_or_manager()

## Columns added or modified
- public.zones_stock.position set to NOT NULL with default 0

## Other adjustments
- Converted trigger creations to idempotent DO blocks
- Removed DROP TRIGGER and DROP POLICY statements
- Reordered SQL blocks (extensions, tables, FKs, indexes, functions, triggers, RLS, policies, views, grants, other)

## Legacy objects removed or ignored
- None

## Views adjusted
- None (no changes required)
