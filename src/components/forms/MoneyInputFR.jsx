import { useEffect, useRef, useState } from 'react';
import Input from '@/components/ui/input.jsx';
import { formatMoneyFR, parseMoneyToNumberFR } from '@/utils/numberFormat';

function isTrailing(raw) {
  const t = (raw ?? '').trim();
  return t.endsWith(',');
}

export default function MoneyInputFR({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder,
  name,
  autoFocus,
  disabled,
  ...props
}) {
  const [text, setText] = useState(
    value == null ? '' : formatMoneyFR(value)
  );
  const focused = useRef(false);
  const caretRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (focused.current) return;
    setText(value == null ? '' : formatMoneyFR(value));
  }, [value]);

  useEffect(() => {
    if (caretRef.current != null && inputRef.current) {
      inputRef.current.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  }, [text]);

  const handleFocus = (e) => {
    focused.current = true;
    queueMicrotask(() => e.target.select());
  };

  const handleChange = (e) => {
    let raw = e.target.value ?? '';
    const selection = e.target.selectionStart ?? raw.length;
    raw = raw.replace(/\./g, ',');
    raw = raw.replace(/[^0-9,\s€]/g, '');
    const trailing = isTrailing(raw);

    if (raw === '') {
      setText('');
      return;
    }

    const num = parseMoneyToNumberFR(raw);
    let formatted = formatMoneyFR(num);
    if (trailing) formatted = formatted.replace(/\s?€$/, ',');
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

    if (!trailing) onChange?.(num);
  };

  const handleBlur = (e) => {
    focused.current = false;
    if (text === '') {
      onBlur?.(e);
      return;
    }
    const num = parseMoneyToNumberFR(text);
    const formatted = formatMoneyFR(num);
    setText(formatted);
    onChange?.(num);
    onBlur?.(e);
  };

  const handleKeyDown = (e) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    if (e.key === ',' || e.key === '.' || /\d/.test(e.key)) return;
    e.preventDefault();
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      pattern="[0-9,. ]*"
      name={name}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      autoFocus={autoFocus}
      lang="fr"
      autoComplete="off"
      {...props}
    />
  );
}

