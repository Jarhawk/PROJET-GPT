export function logError(ctx, error) {
  if (!error) return;
  console.warn(`[supa] ${ctx}`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}
