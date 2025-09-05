export function logError(scope, error, extra = {}) {
  if (!error) return;
  const payload = {
    scope,
    code: error?.code ?? '',
    message: error?.message ?? String(error),
    details: error?.details ?? '',
    hint: error?.hint ?? '',
    status: error?.status ?? '',
    ...extra,
  };
  console.error('[supa]', payload);
  // Option: afficher un toast plus propre selon code
}
