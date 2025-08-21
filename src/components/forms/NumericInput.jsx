import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { parseNumber, formatNumberFR } from '@/utils/number';

export default function NumericInput({ value, onChange, decimals = 2, ...props }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      setText('');
    } else {
      setText(formatNumberFR(value, decimals));
    }
  }, [value, decimals]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    const num = parseNumber(raw);
    onChange?.(num);
  };

  const handleBlur = () => {
    const num = parseNumber(text);
    if (num === null) {
      setText('');
    } else {
      setText(formatNumberFR(num, decimals));
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}
