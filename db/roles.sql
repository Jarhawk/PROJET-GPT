-- MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  access_rights jsonb default '{}'::jsonb,
  actif boolean default true,
  mama_id uuid references mamas(id) on delete cascade,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_roles_mama on roles(mama_id);

create or replace function update_timestamp_roles()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_roles_updated_at on roles;
create trigger trg_roles_updated_at
before update on roles
for each row execute procedure update_timestamp_roles();

alter table roles enable row level security;
alter table roles force row level security;

create policy "roles_select" on roles
for select using (
  mama_id = current_user_mama_id()
);

create policy "roles_insert" on roles
for insert with check (
  mama_id = current_user_mama_id()
  and current_user_is_admin()
);

create policy "roles_update" on roles
for update using (
  mama_id = current_user_mama_id()
  and current_user_is_admin()
);

-- Suppression interdite : désactivation via colonne actif
