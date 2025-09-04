# Rapport build front 2025-09-04

## Résumé
- `npm run typecheck`: KO
- `npm run lint`: OK
- `npm run build`: OK (203 fichiers dans dist/)

## Détails
### npm run typecheck
- > mamastock.com@0.0.0 typecheck
- > tsc --noEmit
- src/api/public/promotions.js(1,1): error TS1490: File appears to be binary.
- src/components/parametrage/SousFamilleList.jsx(1,1): error TS1490: File appears to be binary.
- src/hooks/useInvoiceOcr.js(1,1): error TS1490: File appears to be binary.
- src/pages/signalements/Signalements.jsx(1,1): error TS1490: File appears to be binary.
- src/pages/simulation/SimulationForm.jsx(1,1): error TS1490: File appears to be binary.
- npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.

### npm run lint
- OK

### npm run build
- 203 fichiers dans `dist/`

