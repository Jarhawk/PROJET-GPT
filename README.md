# MamaStock

React application using Supabase. The toolchain relies on modern ESM modules and
requires **Node.js 18+** (see `package.json` engines field).

## Development

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

### Database

SQL scripts are stored in [`sql/`](./sql). To initialise a local Supabase instance:

```bash
supabase start
supabase db reset --file sql/init.sql --seed sql/seed.sql
psql "$SUPABASE_DB_URL" -f sql/rls.sql
```

Adjust configuration in `supabase/config.toml` as required.

## Features
- Supplier price comparison with average and latest purchase metrics
- Comparison page available at `/fournisseurs/comparatif` and linked from the sidebar
- Upload and delete files via Supabase Storage using `useStorage`, with automatic cleanup of replaced uploads
- Daily menu handling provided by `useMenuDuJour`
- PDF export for invoices and fiches techniques using jsPDF
- Forms display links to preview uploaded documents immediately

