import { useState, useRef, useEffect } from 'react';
import { parseEUFloat } from '@/utils/number';

export default function NumberInput({
  value,
  onChangeNumber,
  format,
  placeholder,
  className = '',
  currency = false,
  maxFractionDigits = 2,
  ...rest
}) {
  const [text, setText] = useState('');
  const lastValueRef = useRef(value ?? null);

  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value ?? null;
      if (format) {
        setText(format(value ?? null));
      } else if (value === null || value === undefined) {
        setText('');
      } else {
        setText(
          (value).toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxFractionDigits,
          })
        );
      }
    }
  }, [value, format, maxFractionDigits]);

  return (
    <input
      inputMode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
      placeholder={placeholder}
      className={className}
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const num = parseEUFloat(t);
        onChangeNumber?.(num);
      }}
      onBlur={() => {
        const num = parseEUFloat(text);
        if (format) {
          setText(format(num));
        } else if (num === null) {
          setText('');
        } else {
          setText(
            num.toLocaleString('fr-FR', {
              minimumFractionDigits: currency ? 2 : 0,
              maximumFractionDigits: maxFractionDigits,
            })
          );
        }
      }}
      {...rest}
    />
  );
}
