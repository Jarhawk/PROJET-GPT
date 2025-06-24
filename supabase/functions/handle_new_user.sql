create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.utilisateurs(auth_id, email, mama_id, role, access_rights)
  values (new.id, new.email,
          (select id from public.mamas where actif limit 1),
          'user', '{}'::jsonb)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
after insert on auth.users
for each row execute function handle_new_user();
