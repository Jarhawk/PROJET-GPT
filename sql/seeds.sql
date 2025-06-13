-- Example seed data
insert into mamas (id, nom) values
  ('00000000-0000-0000-0000-000000000001', 'Mama Test')
  on conflict do nothing;

insert into users (email, role, mama_id)
values ('admin@mamastock.com', 'superadmin', '00000000-0000-0000-0000-000000000001')
  on conflict (email) do nothing;
