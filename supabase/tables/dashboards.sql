create table if not exists dashboards (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade,
    mama_id uuid references mamas(id) on delete cascade,
    nom text,
    created_at timestamptz default now()
);

alter table dashboards enable row level security;
alter table dashboards force row level security;
create policy dashboards_owner on dashboards
  for all using (
    user_id = auth.uid() and mama_id = current_user_mama_id()
  ) with check (
    user_id = auth.uid() and mama_id = current_user_mama_id()
  );

grant select, insert, update, delete on dashboards to authenticated;
