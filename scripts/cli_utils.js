// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-env node */

export function shouldShowHelp(args) {
  return args.some((a) => a === '--help' || a === '-h');
}
