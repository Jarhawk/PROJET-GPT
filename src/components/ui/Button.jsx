// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function Button({ children, variant = 'secondary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-xl text-sm font-semibold transition-colors';
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    ghost: 'bg-transparent text-white hover:bg-white/10',
  };
  return (
    <button className={`${base} ${styles[variant] || styles.secondary} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
