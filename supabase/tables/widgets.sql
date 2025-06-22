create table if not exists widgets (
    id uuid primary key default uuid_generate_v4(),
    dashboard_id uuid references dashboards(id) on delete cascade,
    config jsonb,
    ordre int default 0
);

alter table widgets enable row level security;
alter table widgets force row level security;
create policy widgets_owner on widgets
  for all using (
    exists (
      select 1 from dashboards d
      where d.id = widgets.dashboard_id
        and d.user_id = auth.uid()
        and d.mama_id = current_user_mama_id()
    )
  ) with check (
    exists (
      select 1 from dashboards d
      where d.id = widgets.dashboard_id
        and d.user_id = auth.uid()
        and d.mama_id = current_user_mama_id()
    )
  );

grant select, insert, update, delete on widgets to authenticated;
