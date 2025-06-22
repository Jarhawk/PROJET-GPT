create table if not exists audit_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid,
    mama_id uuid,
    action text,
    table_name text,
    created_at timestamptz default now()
);

alter table audit_logs enable row level security;
create policy select_own_or_admin on audit_logs
  for select using (
    user_id = auth.uid() or
    exists(
      select 1 from users u
      join roles r on u.role_id = r.id
      where u.id = auth.uid() and r.nom in ('admin','superadmin')
    )
  );
