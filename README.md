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

### Environment variables

Create a `.env` file at the project root with your Supabase credentials. For
development this repository already includes default values:

```env
VITE_SUPABASE_URL=https://jhpfdeolleprmvtchoxt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocGZkZW9sbGVwcm12dGNob3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjI4MzMsImV4cCI6MjA2MjI5ODgzM30.f_J81QTBK4cvFoFUvlY6XNmuS5DSMLUdT_ZQQ7FpOFQ
```

These variables are loaded by Vite during development and build.

The `.env` file is not tracked by Git, so you can safely replace these
defaults with your own credentials for local development.

## Features
- Supplier price comparison with average and latest purchase metrics
- Comparison page available at `/fournisseurs/comparatif` and linked from the sidebar
- Upload and delete files via Supabase Storage using `useStorage`, with automatic cleanup of replaced uploads
- Daily menu handling provided by `useMenuDuJour`
- PDF export for invoices and fiches techniques using jsPDF
- Forms display links to preview uploaded documents immediately


## FAQ

**Dev server cannot connect to Supabase**

Ensure the `.env` file contains valid Supabase credentials and that you have an active internet connection. Delete `node_modules` and run `npm install` if issues persist.
