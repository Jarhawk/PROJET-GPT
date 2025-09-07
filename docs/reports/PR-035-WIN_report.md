# PR-035-WIN Report

## Summary
- Replace legacy `bcryptjs` with browser-compatible `bcrypt-ts` to avoid Node `crypto` dependency in front-end builds.
- Added `bcrypt-ts` dependency and removed `bcryptjs`.

## Files
- `package.json`
- `package-lock.json`

## Migration Notes
- `bcrypt-ts` relies on the Web Crypto API; ensure the runtime environment supports it (modern browsers/WebView2).
- Keep a consistent salt rounds factor (current examples use `10`) to maintain hashing strength.

## Testing
- `npm install`
- `npm run build`
