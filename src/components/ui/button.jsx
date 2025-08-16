// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import * as React from 'react';

const Button = React.forwardRef(
  (
    { children, variant = 'secondary', icon: Icon, className = '', ...props },
    ref
  ) => {
    const base =
      'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors';
    const styles = {
      primary: 'bg-primary text-white hover:bg-primary-90',
      secondary: 'bg-white/10 text-white hover:bg-white/20',
      ghost: 'bg-transparent text-white hover:bg-white/10',
    };
    return (
      <button
        ref={ref}
        className={`${base} ${styles[variant] || styles.secondary} ${className}`}
        {...props}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
