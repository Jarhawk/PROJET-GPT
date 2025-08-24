import { useEffect, useState } from 'react';
import { formatQty, parseQty } from '@/utils/numberFormat';

export default function QtyInput({ value, onChange, className = '', ...props }) {
  const [display, setDisplay] = useState(formatQty(value ?? 0));
  useEffect(() => { setDisplay(formatQty(value ?? 0)); }, [value]);

  function handleChange(e) {
    const v = e.target.value;
    setDisplay(v);
    onChange?.(parseQty(v));
  }
  function handleBlur() { setDisplay(formatQty(value ?? 0)); }

  return (
    <input
      inputMode="decimal"
      className={`input ${className}`}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}
