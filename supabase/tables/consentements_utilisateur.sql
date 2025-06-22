create table if not exists consentements_utilisateur (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade,
    mama_id uuid,
    consentement boolean,
    date_consentement timestamptz default now()
);

alter table consentements_utilisateur enable row level security;
create policy user_own_consent on consentements_utilisateur
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
