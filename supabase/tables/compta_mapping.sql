create table if not exists compta_mapping (
    id uuid primary key default uuid_generate_v4(),
    mama_id uuid not null references mamas(id) on delete cascade,
    type text not null,
    cle text not null,
    compte text not null,
    created_at timestamptz default now(),
    unique(mama_id, type, cle)
);

alter table compta_mapping enable row level security;
alter table compta_mapping force row level security;
create policy compta_mapping_admin on compta_mapping
  for all using (
    mama_id = current_user_mama_id() and
    exists(
      select 1 from users u
      join roles r on u.role_id = r.id
      where u.id = auth.uid() and r.nom in ('admin','superadmin','compta')
    )
  )
  with check (
    mama_id = current_user_mama_id() and
    exists(
      select 1 from users u
      join roles r on u.role_id = r.id
      where u.id = auth.uid() and r.nom in ('admin','superadmin','compta')
    )
  );
grant select, insert, update, delete on compta_mapping to authenticated;
