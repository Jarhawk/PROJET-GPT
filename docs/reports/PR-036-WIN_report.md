# PR-036-WIN Report

## Files Modified
- src/adapters/fs.ts
- src/adapters/path.ts
- src/lib/config.ts
- src/lib/lock.ts
- src/lib/shutdown.ts
- src/lib/fsHelpers.ts
- src/lib/db.ts
- src/main.jsx

## Node API Removal
- Replaced `fs`, `path`, and `os` imports with Tauri FS and Path adapters.
- Removed synchronous filesystem calls in favour of async Tauri plugin calls.
- Substituted `process.pid` based IDs with `crypto.randomUUID()`.
- Eliminated direct Node-based database layer and routed calls through Tauri `invoke` commands.

## Mapping to Tauri APIs
- File operations -> `@tauri-apps/plugin-fs` via `src/adapters/fs.ts`.
- Path utilities -> `@tauri-apps/api/path` via `src/adapters/path.ts`.
- Dialog interactions -> `@tauri-apps/plugin-dialog`.
- Backend commands -> `@tauri-apps/api/core` `invoke`.
