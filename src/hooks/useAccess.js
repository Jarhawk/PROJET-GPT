import { useAuth } from './useAuth';

export default function useAccess(module, action = 'view') {
  const { hasAccess, loading, pending, isSuperadmin } = useAuth();
  const allowed = module ? hasAccess(module, action) : false;
  const ready = !loading && !pending;
  return { allowed: isSuperadmin || allowed, loading: !ready };
}

