create or replace function cron_purge_inactive_users()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from users
  where actif = false
    and created_at < now() - interval '2 years';
end;
$$;

-- schedule daily at 03:00 via pg_cron
select cron.schedule('purge_inactive_users', '0 3 * * *', $$call cron_purge_inactive_users();$$);
