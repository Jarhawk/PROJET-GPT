# Supabase SQL Scripts

This folder contains SQL files to bootstrap a fresh Supabase project for MamaStock.

- `init.sql` – full schema creation with triggers
- `rls.sql`  – row level security policies
- `seed.sql` – example seed data

To initialize a local project with the Supabase CLI:

```bash
supabase start
supabase db reset --file sql/init.sql --seed sql/seed.sql
psql "$SUPABASE_DB_URL" -f sql/rls.sql
psql "$SUPABASE_DB_URL" -f sql/mama_stock_patch.sql
```

Adjust the command to your workflow if needed.
