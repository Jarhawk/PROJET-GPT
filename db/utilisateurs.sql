-- MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
-- Table et sécurité pour les utilisateurs MamaStock

create table if not exists public.utilisateurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  auth_id uuid unique,
  role_id uuid references public.roles(id) on delete restrict,
  mama_id uuid references public.mamas(id) on delete cascade,
  actif boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- RLS policies
alter table public.utilisateurs enable row level security;

drop policy if exists utilisateurs_select on public.utilisateurs;
drop policy if exists utilisateurs_insert on public.utilisateurs;
drop policy if exists utilisateurs_update on public.utilisateurs;

create policy utilisateurs_select on public.utilisateurs
  for select using (
    mama_id = current_user_mama_id()
  );

create policy utilisateurs_insert on public.utilisateurs
  for insert with check (
    current_user_role() = 'admin'
    and mama_id = current_user_mama_id()
  );

create policy utilisateurs_update on public.utilisateurs
  for update using (
    current_user_role() = 'admin'
    and mama_id = current_user_mama_id()
  );

grant all on public.utilisateurs to authenticated;

-- RPC function for creating a user and sending credentials
create or replace function public.create_utilisateur(
  p_email text,
  p_nom text,
  p_role_id uuid,
  p_mama_id uuid
) returns json
language plpgsql
security definer
as $$
declare
  v_auth_id uuid;
  v_password text;
begin
  -- ensure email not already used
  if exists(select 1 from auth.users where lower(email) = lower(p_email)) then
    raise exception 'email exists';
  end if;

  -- generate password
  v_password := encode(gen_random_bytes(9), 'base64');

  -- create auth user
  insert into auth.users(email, encrypted_password)
  values (p_email, crypt(v_password, gen_salt('bf'))) returning id into v_auth_id;

  -- insert into utilisateurs table
  insert into public.utilisateurs(nom, email, auth_id, role_id, mama_id, actif)
  values(p_nom, p_email, v_auth_id, p_role_id, p_mama_id, true);

  -- send email via http (placeholder)
  perform net.http_post(
    url => 'https://example.com/send',
    body => jsonb_build_object('email', p_email, 'password', v_password)
  );

  return json_build_object('success', true);
exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;$$;

grant execute on function public.create_utilisateur(text, text, uuid, uuid) to authenticated;
