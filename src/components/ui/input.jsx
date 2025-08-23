// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/ui/input.jsx

import * as React from 'react';

const Input = React.forwardRef(
  (
    {
      type = 'text',
      value,
      onChange,
      placeholder,
      className = '',
      disabled = false,
      ariaLabel,
      id,
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      if (type === 'number') {
        e.target.value = e.target.value.replace(',', '.');
      }
      onChange?.(e);
    };
    return (
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
        className={`w-full px-4 py-2 font-semibold text-white placeholder-white/50 bg-white/10 backdrop-blur rounded-md shadow-lg
border border-white/20 ring-1 ring-white/20 focus:outline-none hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...(type === 'number' ? { inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*' } : {})}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;

