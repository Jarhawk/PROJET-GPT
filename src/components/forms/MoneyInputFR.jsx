import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function normalize(raw) {
  return raw
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/\s+/g, '')
    .replace(/€/g, '')
    .replace(/,/g, '.');
}
function isTrailingSep(raw) {
  const t = (raw ?? '').trim();
  return t.endsWith(',') || t.endsWith('.');
}

export default function MoneyInputFR({
  value,
  onValueChange,
  allowNegative = false,
  placeholder,
  disabled,
  name,
  className = 'input input-bordered w-full',
}) {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const format = useCallback((n) => (Number.isFinite(n) ? formatter.format(n) : ''), [formatter]);

  const [text, setText] = useState(value == null ? '' : format(value));
  const focused = useRef(false);
  const caretRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (focused.current) return;
    setText(value == null ? '' : format(value));
  }, [value, format]);

  useEffect(() => {
    if (caretRef.current != null && inputRef.current) {
      inputRef.current.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  }, [text]);

  const onFocus = (e) => {
    focused.current = true;
    queueMicrotask(() => e.target.select());
  };

  const onChange = (e) => {
    const raw = e.target.value ?? '';
    const selection = e.target.selectionStart ?? raw.length;
    const allowed = allowNegative ? /[^0-9.,\s€-]/g : /[^0-9.,\s€]/g;
    const cleanedRaw = raw.replace(allowed, '');
    const trailing = isTrailingSep(cleanedRaw);
    const normalized = normalize(cleanedRaw);

    if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.') {
      setText(cleanedRaw);
      onValueChange?.(null);
      return;
    }

    const num = Number(normalized);
    if (!Number.isFinite(num)) {
      setText(cleanedRaw);
      onValueChange?.(null);
      return;
    }

    let formatted = format(num);
    if (trailing) {
      formatted = formatted.replace(/\s?€$/, ',');
    }

    setText(formatted);

    const digitsBefore = raw.slice(0, selection).replace(/\D/g, '').length;
    let caret = 0;
    let digits = 0;
    while (caret < formatted.length && digits < digitsBefore) {
      if (/\d/.test(formatted[caret])) digits++;
      caret++;
    }
    if (trailing) caret = formatted.length;
    caretRef.current = caret;

    if (!trailing) onValueChange?.(num);
  };

  const onBlur = () => {
    focused.current = false;
    const parsed = Number(normalize(text));
    if (!Number.isFinite(parsed)) {
      setText('');
      onValueChange?.(null);
      return;
    }
    let n = parsed;
    const formatted = format(n);
    setText(formatted);
    onValueChange?.(n);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      pattern={allowNegative ? '[0-9.,\\s€-]*' : '[0-9.,\\s€]*'}
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

