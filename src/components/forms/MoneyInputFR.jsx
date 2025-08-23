import { useEffect, useMemo, useState } from 'react';

function normalize(raw) {
  return raw
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.');
}

export default function MoneyInputFR({
  value,
  onValueChange,
  min,
  max,
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

  const [text, setText] = useState(value == null ? '' : formatter.format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setText(value == null ? '' : formatter.format(value));
  }, [value, formatter, focused]);

  const parse = (raw) => {
    const normalized = normalize(raw);
    if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.') return null;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  };

  const onChange = (e) => {
    const raw = e.target.value ?? '';
    const allowed = allowNegative ? /[^0-9.,\s-€]/g : /[^0-9.,\s€]/g;
    const cleaned = raw.replace(allowed, '');
    const num = parse(cleaned);
    if (num === null) {
      setText(cleaned);
      onValueChange?.(null);
      return;
    }
    if (min !== undefined && num < min) return;
    if (max !== undefined && num > max) return;
    setText(formatter.format(num));
    onValueChange?.(num);
  };

  const onBlur = () => {
    setFocused(false);
    const num = parse(text);
    if (num === null) {
      setText('');
      onValueChange?.(null);
      return;
    }
    let n = num;
    if (min !== undefined && n < min) n = min;
    if (max !== undefined && n > max) n = max;
    setText(formatter.format(n));
    onValueChange?.(n);
  };

  const onFocus = (e) => {
    setFocused(true);
    queueMicrotask(() => e.target.select());
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern={allowNegative ? "[0-9.,\\s-€]*" : "[0-9.,\\s€]*"}
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

