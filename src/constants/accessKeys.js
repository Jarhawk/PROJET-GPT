import { MODULES } from '@/config/modules';

const MODULE_LIST = Array.isArray(MODULES) ? MODULES : [];

const keys = [];
for (const m of MODULE_LIST) keys.push(m.key);

export const MODULE_KEYS = keys;

export const PUBLIC_MODULES = ['dashboard', 'home', 'debug'];
