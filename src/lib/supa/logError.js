export const logSupaError = (label, error) => {
  if (!error) return;
  console.error(`[supa] ${label}`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
};
