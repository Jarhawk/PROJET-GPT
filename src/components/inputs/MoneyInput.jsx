import { useEffect, useRef, useState } from 'react';
import { formatMoneyFromCents, parseMoneyToCents } from '@/utils/numberFormat';

export default function MoneyInput({ valueCents, onChangeCents, className = '', ...props }) {
  const [display, setDisplay] = useState(formatMoneyFromCents(valueCents ?? 0));
  const ref = useRef(null);

  useEffect(() => { setDisplay(formatMoneyFromCents(valueCents ?? 0)); }, [valueCents]);

  function handleChange(e) {
    const v = e.target.value;
    setDisplay(v);
    const cents = parseMoneyToCents(v);
    onChangeCents?.(cents);
  }
  function handleBlur() { setDisplay(formatMoneyFromCents(valueCents ?? 0)); }

  return (
    <input
      ref={ref}
      inputMode="decimal"
      className={`input ${className}`}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}
