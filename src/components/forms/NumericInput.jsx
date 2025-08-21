import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { parseNumber, formatNumberFR } from '@/utils/number';

export default function NumericInput({ value, onChange, decimals = 2, ...props }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      setDisplay('');
    } else {
      setDisplay(formatNumberFR(value, decimals));
    }
  }, [value, decimals]);

  const handleChange = useCallback(
    (e) => {
      const raw = e.target.value;
      setDisplay(raw);
      const num = parseNumber(raw);
      onChange?.(num);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    const num = parseNumber(display);
    if (num === null) {
      setDisplay('');
    } else {
      setDisplay(formatNumberFR(num, decimals));
    }
  }, [display, decimals]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}
