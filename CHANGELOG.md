# Changelog

## [Unreleased]
### Added
- Playwright end-to-end tests (`npm run test:e2e`).
- GitHub Actions workflow running `npm audit fix`, lint, unit and e2e tests.

### Changed
- Updated ESLint config and cleaned all warnings.
- Dependencies updated via `npm audit fix`.

### Known Issues
- `xlsx` package has a high severity vulnerability that cannot be fixed automatically.
