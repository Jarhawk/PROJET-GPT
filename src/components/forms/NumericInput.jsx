// NumericInput.jsx — saisie FR tolérante, sans milliers, pas de reformatage en cours de frappe
import { useEffect, useRef, useState } from 'react';

function normalize(raw) {
  return raw
    .replace(/\u00A0/g, ' ') // nbsp -> space
    .replace(/\s+/g, '')     // remove spaces
    .replace(/,/g, '.');     // comma -> dot
}
function isTrailingSep(raw) {
  const t = (raw ?? '').trim();
  return t.endsWith(',') || t.endsWith('.');
}
function parseLoose(raw) {
  const s = normalize(raw ?? '');
  if (!s || s === '-' || s === '.' || s === '-.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
// format sans séparateur de milliers, décimales fixes si demandées
function formatFrNoGroup(n, decimals) {
  if (n == null || Number.isNaN(n)) return '';
  if (typeof decimals === 'number') {
    return n.toFixed(decimals).replace('.', ','); // ex: 1200,00
  }
  return String(n).replace('.', ',');
}

export default function NumericInput({
  value,                 // number | null
  onValueChange,         // (n: number|null) => void
  decimals,              // ex: 2
  min, max,
  allowNegative = false,
  placeholder,
  disabled,
  name,
  className = 'input input-bordered w-full',
}) {
  const [text, setText] = useState(value == null ? '' : String(value).replace('.', ','));
  const focused = useRef(false);

  // ne réécrit PAS le champ quand il a le focus
  useEffect(() => {
    if (focused.current) return;
    setText(value == null ? '' : String(value).replace('.', ','));
  }, [value]);

  const onFocus = (e) => {
    focused.current = true;
    // sélectionne pour faciliter la modif
    queueMicrotask(() => e.target.select());
  };

  const onChange = (e) => {
    const raw = e.target.value ?? '';
    const allowed = allowNegative ? /[^0-9.,\s-]/g : /[^0-9.,\s]/g;
    const cleaned = raw.replace(allowed, '');
    setText(cleaned);

    // ne pousse pas vers le parent si la saisie se termine par , ou .
    if (isTrailingSep(cleaned)) return;

    const parsed = parseLoose(cleaned);
    if (parsed === null) {
      onValueChange?.(null);
      return;
    }
    if (min !== undefined && parsed < min) return;
    if (max !== undefined && parsed > max) return;
    onValueChange?.(parsed);
  };

  const onBlur = () => {
    focused.current = false;
    const parsed = parseLoose(text);
    if (parsed === null) {
      setText('');
      onValueChange?.(null);
      return;
    }
    let n = parsed;
    if (min !== undefined && n < min) n = min;
    if (max !== undefined && n > max) n = max;
    // format FR sans milliers
    setText(formatFrNoGroup(n, typeof decimals === 'number' ? decimals : undefined));
    onValueChange?.(n);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern={allowNegative ? "[0-9.,\\s-]*" : "[0-9.,\\s]*"}
      name={name}
      value={text}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      lang="fr"
      autoComplete="off"
    />
  );
}

