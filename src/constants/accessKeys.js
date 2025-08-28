import { MODULES } from '@/config/modules';

const modules = Array.isArray(MODULES) ? MODULES : [];

export const MODULE_KEYS = Array.isArray(modules)
  ? modules.map((m) => m.key)
  : [];

export const PUBLIC_MODULES = ['dashboard', 'home', 'debug'];
