# Rapport de séparation
- Nombre de blocs admin-only déplacés : 11
- Nombre de blocs app-safe : reste du schéma public (≈3300 lignes)

## Détails
| Bloc | Destination | Raison |
|------|-------------|--------|
| create extension pgcrypto | 00_admin_only.sql | Extension ⇒ admin-only |
| create extension pg_net | 00_admin_only.sql | Extension ⇒ admin-only |
| create role authenticated | 00_admin_only.sql | Création de rôle ⇒ admin-only |
| function public.current_user_mama_id | 00_admin_only.sql | Référence auth.uid() ⇒ admin-only |
| function public.current_user_is_admin_or_manager | 00_admin_only.sql | Référence auth.uid() ⇒ admin-only |
| function public.current_user_is_admin | 00_admin_only.sql | Référence auth.uid() ⇒ admin-only |
| function public.create_utilisateur | 00_admin_only.sql | DML sur auth.users + net.http_post ⇒ admin-only |
| policy zones_stock_select on public.zones_stock | 00_admin_only.sql | RLS utilisant auth.uid() ⇒ admin-only |
| function public.can_access_zone | 00_admin_only.sql | SECURITY DEFINER + auth.uid() ⇒ admin-only |
| policy user_mama_access_select on public.user_mama_access | 00_admin_only.sql | RLS utilisant auth.uid() ⇒ admin-only |
| function public.log_action | 00_admin_only.sql | SECURITY DEFINER + auth.uid() ⇒ admin-only |
| create schema if not exists auth | supprimé | Schéma géré par Supabase (interdit) |
| create or replace function auth.uid() | supprimé | Ne jamais surcharger auth.uid() |

## Points de vigilance
- Les policies et fonctions restantes dans 01_app_safe.sql reposent sur les fonctions définies dans 00_admin_only.sql. Exécuter d'abord le script admin.
- Vérifier que les extensions pgcrypto et pg_net sont présentes avant d'exécuter les fonctions correspondantes.

## Hypothèses
- Les appels à auth.uid() nécessitent un niveau de privilège élevé et ont été isolés dans 00_admin_only.sql.
