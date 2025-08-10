export function idFromLabel(label, prefix = "fld") {
  if (!label) return `${prefix}-${Math.random().toString(36).slice(2,8)}`;
  return `${prefix}-${label.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}]+/gu,"-")
    .replace(/(^-|-$)/g,"")}-${Math.random().toString(36).slice(2,5)}`;
}
