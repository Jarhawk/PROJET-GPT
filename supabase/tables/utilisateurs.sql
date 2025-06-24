create table if not exists public.utilisateurs (
    id uuid primary key default uuid_generate_v4(),
    auth_id uuid references auth.users(id) on delete cascade,
    email text,
    role text default 'user',
    mama_id uuid references public.mamas(id),
    access_rights jsonb default '{}'::jsonb,
    actif boolean default true,
    created_at timestamptz default now()
);

alter table public.utilisateurs enable row level security;
create policy utilisateurs_select on public.utilisateurs
  for select using (auth.uid() = auth_id);
