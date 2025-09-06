# PR-006 Report

## Summary
- Added local data directory selection page storing config in `%APPDATA%/MamaStock/config.json`.
- Implemented distributed lock and shutdown handling with `db.lock.json` and `shutdown.request.json`.
- Integrated startup lock acquisition, shutdown monitoring, and "Quitter & synchroniser" button.

## Testing
- `npm run lint`
- `npm test`
