-- 1) Colonne + index
alter table public.zones_stock
  add column if not exists position int default 0;

create index if not exists idx_zones_mama_pos
  on public.zones_stock(mama_id, position);

-- 2) Backfill (une numérotation par mama, stable par created_at puis nom)
with ranked as (
  select id,
         row_number() over(partition by mama_id order by created_at, nom) - 1 as rn
  from public.zones_stock
)
update public.zones_stock z
set position = r.rn
from ranked r
where r.id = z.id
  and (z.position is null or z.position = 0);

-- 3) Trigger updated_at (si pas déjà présent)
create or replace function public.trg_set_timestamp() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists set_ts_zones on public.zones_stock;
create trigger set_ts_zones before update on public.zones_stock
for each row execute procedure public.trg_set_timestamp();

-- 4) RLS : autoriser la màj de position aux admins/managers
drop policy if exists zones_stock_admin_iud on public.zones_stock;
create policy zones_stock_admin_iud on public.zones_stock
for all
using (mama_id = current_user_mama_id() and public.current_user_is_admin_or_manager())
with check (mama_id = current_user_mama_id() and public.current_user_is_admin_or_manager());
