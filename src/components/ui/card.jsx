// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg text-white ${className}`}>
      {title && <h2 className="text-xl font-bold mb-4 p-6 pb-0">{title}</h2>}
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`p-4 pb-0 ${className}`}>{children}</div>;
}

export function CardContent({ children }) {
  return <div className="p-6">{children}</div>;
}

export default Card;
