export function logError(scope, error, extra = {}) {
  if (!error) return;
  const payload = {
    scope,
    code: error?.code ?? '',
    status: error?.status ?? '',
    message: error?.message ?? String(error),
    details: error?.details ?? '',
    hint: error?.hint ?? '',
    ...extra,
  };
  console.error('[supa]', payload);
}
