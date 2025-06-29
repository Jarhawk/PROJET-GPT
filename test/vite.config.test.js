// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import fs from 'fs';
import { test, expect } from 'vitest';

test('vite config includes VitePWA', () => {
  const content = fs.readFileSync('vite.config.js', 'utf8');
  expect(content).toMatch(/VitePWA/);
});
