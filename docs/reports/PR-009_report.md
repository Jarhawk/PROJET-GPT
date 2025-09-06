# PR-009 Report

## Summary
- Added local CSV/XLSX/PDF export helpers writing to `Documents/MamaStock/Exports`.
- Product, supplier and invoice lists expose export buttons.
- Updated offline README and frontend status snapshot.

## Testing
- `npm run lint`
- `npm test` (fails: missing Supabase credentials)
- Generated CSV/XLSX/PDF via `node` script
