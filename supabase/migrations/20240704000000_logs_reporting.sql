-- Logs & reporting module

-- Table storing all activity logs
create table if not exists logs_activite (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  module text,
  description text,
  donnees jsonb,
  ip_address inet,
  user_agent text,
  date_log timestamptz default now(),
  critique boolean default false
);

create index if not exists idx_logs_mama_date on logs_activite(mama_id, date_log desc);
create index if not exists idx_logs_type on logs_activite(type);
create index if not exists idx_logs_module on logs_activite(module);

alter table logs_activite enable row level security;
create policy logs_select_self on logs_activite
  for select using (mama_id = current_user_mama_id());
create policy logs_insert_self on logs_activite
  for insert with check (mama_id = current_user_mama_id());

grant select, insert on logs_activite to authenticated;

-- Helper function for inserting a log entry
create or replace function log_action(
  p_mama_id uuid,
  p_type text,
  p_module text,
  p_description text,
  p_donnees jsonb default '{}'::jsonb,
  p_critique boolean default false
)
returns void
language plpgsql security definer
as $$
begin
  insert into logs_activite(mama_id, user_id, type, module, description, donnees, ip_address, user_agent, critique)
  values (
    p_mama_id,
    auth.uid(),
    p_type,
    p_module,
    p_description,
    p_donnees,
    null,
    null,
    p_critique
  );
end;
$$;

-- Table tracking generated reports
create table if not exists rapports_generes (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null references mamas(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  module text not null,
  periode_debut date,
  periode_fin date,
  chemin_fichier text,
  date_generation timestamptz default now()
);

alter table rapports_generes enable row level security;
create policy rapports_select_self on rapports_generes
  for select using (mama_id = current_user_mama_id());
create policy rapports_insert_self on rapports_generes
  for insert with check (mama_id = current_user_mama_id());

grant select, insert on rapports_generes to authenticated;
