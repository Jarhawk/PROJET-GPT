-- Example seed data for local development
insert into roles (nom, description) values
  ('superadmin', 'Super administrateur'),
  ('admin', 'Administrateur'),
  ('user', 'Utilisateur')
  on conflict (nom) do nothing;

-- default mama
insert into mamas(id, nom, created_at)
  values (uuid_generate_v4(), 'Mama Test', now())
  returning id;

