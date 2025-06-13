# MamaStock

React application using Supabase. The toolchain relies on modern ESM modules,
so make sure you are running **Node.js 18+**.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

### Database

SQL scripts are stored in [`sql/`](./sql). To initialise a local Supabase instance:

```bash
supabase start
supabase db reset --file sql/schema.sql --seed sql/seeds.sql
```

Adjust configuration in `supabase/config.toml` as required.
