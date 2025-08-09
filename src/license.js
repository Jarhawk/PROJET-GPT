// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import data from '@/db/license-keys.json';

export function validateLicense(key) {
  const lic = data.licenses.find((l) => l.key === key && !l.revoked);
  if (!lic) return { valid: false, message: 'Licence invalide' };
  if (new Date(lic.expires) < new Date()) return { valid: false, message: 'Licence expirée' };
  return { valid: true, client: lic.client };
}

export function watermark(key) {
  const res = validateLicense(key);
  return res.valid ? `licence délivrée à : ${res.client}` : 'licence invalide';
}
