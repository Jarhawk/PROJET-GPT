# Supabase SQL Scripts

This folder contains SQL files to bootstrap a fresh Supabase project for MamaStock.

- `schema.sql` – tables and minimal policies
- `seeds.sql`  – example seed data

To initialize a local project with the Supabase CLI:

```bash
supabase start
supabase db reset --file sql/schema.sql --seed sql/seeds.sql
```

Adjust the command to your workflow if needed.
