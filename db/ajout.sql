-- MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
-- Ajouts module commandes fournisseur

create table if not exists public.commandes (
  id uuid primary key default uuid_generate_v4(),
  mama_id uuid references public.mamas(id) on delete cascade,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  reference text,
  date_commande date default current_date,
  statut text default 'brouillon' check (statut in ('brouillon','validée','envoyée')),
  commentaire text,
  created_by uuid references public.utilisateurs(id) on delete set null,
  validated_by uuid,
  envoyee_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.commande_lignes (
  id uuid primary key default uuid_generate_v4(),
  commande_id uuid references public.commandes(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete cascade,
  quantite numeric,
  unite text,
  prix_achat numeric,
  total_ligne numeric generated always as (coalesce(quantite,0) * coalesce(prix_achat,0)) stored,
  suggestion boolean default false,
  commentaire text
);

create index if not exists idx_commandes_mama_id on public.commandes(mama_id);
create index if not exists idx_commandes_fournisseur_id on public.commandes(fournisseur_id);
create index if not exists idx_lignes_commande_id on public.commande_lignes(commande_id);

alter table public.commandes enable row level security;
create policy commandes_access on public.commandes
  for all using (mama_id = current_user_mama_id())
  with check (mama_id = current_user_mama_id());

alter table public.commande_lignes enable row level security;
create policy commande_lignes_access on public.commande_lignes
  for all using (
    commande_id in (select id from public.commandes where mama_id = current_user_mama_id())
  )
  with check (
    commande_id in (select id from public.commandes where mama_id = current_user_mama_id())
  );

grant select, insert, update, delete on public.commandes, public.commande_lignes to authenticated;

-- Templates de commandes fournisseur
create table if not exists public.templates_commandes (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  adresse_livraison text,
  pied_de_page text,
  champs_visibles jsonb default '{}'::jsonb,
  actif boolean default true,
  mama_id uuid references public.mamas(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_templates_commandes_mama on public.templates_commandes(mama_id);

create or replace function public.update_timestamp_templates()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_templates_commandes_updated_at
before update on public.templates_commandes
for each row execute procedure public.update_timestamp_templates();

alter table public.templates_commandes enable row level security;
alter table public.templates_commandes force row level security;

create policy select_templates on public.templates_commandes
for select using (
  mama_id = current_user_mama_id()
);

create policy insert_templates on public.templates_commandes
for insert with check (
  mama_id = current_user_mama_id()
  and current_user_is_admin_or_manager()
);

create policy update_templates on public.templates_commandes
for update using (
  mama_id = current_user_mama_id()
  and current_user_is_admin_or_manager()
);

grant select, insert, update, delete on public.templates_commandes to authenticated;
