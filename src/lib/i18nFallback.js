export function labelFallback(labelKey, path) {
  if (labelKey) return labelKey;
  const leaf = path.split('/').filter(Boolean).pop() || 'home';
  return 'nav.' + leaf.toLowerCase();
}
