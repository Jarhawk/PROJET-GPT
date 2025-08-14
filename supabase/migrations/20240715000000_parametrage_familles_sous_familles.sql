-- Migration for familles & sous_familles parametrage
-- Implements Prompt Codex #12 backend requirements

-- 0) Add famille_id & sous_famille_id to produits if missing
alter table if exists produits
  add column if not exists famille_id uuid,
  add column if not exists sous_famille_id uuid;

alter table if exists produits
  add constraint if not exists fk_produits_famille_id
    foreign key (famille_id) references familles(id) on delete restrict;

alter table if exists produits
  add constraint if not exists fk_produits_sous_famille_id
    foreign key (sous_famille_id) references sous_familles(id) on delete restrict;

create index if not exists idx_produits_famille on produits(famille_id);
create index if not exists idx_produits_sous_famille on produits(sous_famille_id);

-- 1) Tables familles / sous_familles adjustments
create table if not exists familles (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id) on delete cascade,
  nom text not null,
  parent_id uuid references familles(id) on delete set null,
  position int default 0,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_familles_nom_mama unique (mama_id, nom)
);

create table if not exists sous_familles (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id) on delete cascade,
  famille_id uuid not null references familles(id) on delete cascade,
  nom text not null,
  position int default 0,
  actif boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_sousfamilles_nom_mama unique (mama_id, nom)
);

-- Ensure new columns exist on pre-existing tables
alter table if exists familles
  add column if not exists position int default 0,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists parent_id uuid;

alter table if exists familles
  add constraint if not exists fk_familles_parent_id
    foreign key (parent_id) references familles(id) on delete set null;

alter table if exists sous_familles
  add column if not exists position int default 0,
  add column if not exists updated_at timestamptz default now();

-- Ensure unique constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_familles_nom_mama') THEN
    ALTER TABLE familles ADD CONSTRAINT uq_familles_nom_mama UNIQUE (mama_id, nom);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_sousfamilles_nom_mama') THEN
    ALTER TABLE sous_familles ADD CONSTRAINT uq_sousfamilles_nom_mama UNIQUE (mama_id, nom);
  END IF;
END $$;

create index if not exists idx_familles_mama_pos on familles(mama_id, position);
create index if not exists idx_familles_parent on familles(parent_id);
create index if not exists idx_sous_familles_famille_pos on sous_familles(famille_id, position);

-- 2) RLS policies
alter table familles enable row level security;
alter table sous_familles enable row level security;

CREATE POLICY IF NOT EXISTS familles_all ON familles
FOR ALL USING (mama_id = current_user_mama_id())
WITH CHECK (mama_id = current_user_mama_id());

CREATE POLICY IF NOT EXISTS sous_familles_all ON sous_familles
FOR ALL USING (mama_id = current_user_mama_id())
WITH CHECK (mama_id = current_user_mama_id());

grant select, insert, update, delete on familles to authenticated;
grant select, insert, update, delete on sous_familles to authenticated;

-- 3) Triggers updated_at
create or replace function trg_set_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists set_ts_familles on familles;
create trigger set_ts_familles before update on familles
for each row execute function trg_set_timestamp();

drop trigger if exists set_ts_sous_familles on sous_familles;
create trigger set_ts_sous_familles before update on sous_familles
for each row execute function trg_set_timestamp();

-- 4) Prevent deletion if referenced
create or replace function prevent_delete_famille_if_linked() returns trigger as $$
begin
  if exists (select 1 from produits p where p.famille_id = old.id) then
    raise exception 'Impossible de supprimer une famille rattachée à des produits';
  end if;
  return old;
end; $$ language plpgsql;

drop trigger if exists tg_prevent_delete_famille on familles;
create trigger tg_prevent_delete_famille
before delete on familles
for each row execute function prevent_delete_famille_if_linked();

create or replace function prevent_delete_sousfamille_if_linked() returns trigger as $$
begin
  if exists (select 1 from produits p where p.sous_famille_id = old.id) then
    raise exception 'Impossible de supprimer une sous-famille rattachée à des produits';
  end if;
  return old;
end; $$ language plpgsql;

drop trigger if exists tg_prevent_delete_sousfamille on sous_familles;
create trigger tg_prevent_delete_sousfamille
before delete on sous_familles
for each row execute function prevent_delete_sousfamille_if_linked();

-- 5) Utility functions
create or replace function merge_familles(src uuid, dst uuid)
returns void language plpgsql as $$
begin
  update produits set famille_id = dst where famille_id = src;
  delete from familles where id = src;
end; $$;

create or replace function merge_sous_familles(src uuid, dst uuid)
returns void language plpgsql as $$
begin
  update produits set sous_famille_id = dst where sous_famille_id = src;
  delete from sous_familles where id = src;
end; $$;

create or replace function reorder_familles(p_rows jsonb)
returns void language plpgsql as $$
declare r jsonb;
begin
  for r in select * from jsonb_array_elements(p_rows)
  loop
    update familles set position = (r->>'position')::int
    where id = (r->>'id')::uuid and mama_id = current_user_mama_id();
  end loop;
end; $$;

create or replace function reorder_sous_familles(p_famille uuid, p_rows jsonb)
returns void language plpgsql as $$
declare r jsonb;
begin
  for r in select * from jsonb_array_elements(p_rows)
  loop
    update sous_familles set position = (r->>'position')::int
    where id = (r->>'id')::uuid and famille_id = p_famille and mama_id = current_user_mama_id();
  end loop;
end; $$;

-- 6) Views of stats
create or replace view v_familles_stats as
select
  f.mama_id,
  f.id as famille_id,
  f.nom as famille_nom,
  count(p.id) as nb_produits
from familles f
left join produits p on p.famille_id = f.id
where f.mama_id = current_user_mama_id()
group by f.mama_id, f.id, f.nom;

create or replace view v_sous_familles_stats as
select
  sf.mama_id,
  sf.id as sous_famille_id,
  sf.nom as sous_famille_nom,
  sf.famille_id,
  count(p.id) as nb_produits
from sous_familles sf
left join produits p on p.sous_famille_id = sf.id
where sf.mama_id = current_user_mama_id()
group by sf.mama_id, sf.id, sf.nom, sf.famille_id;

grant select on v_familles_stats to authenticated;
grant select on v_sous_familles_stats to authenticated;
