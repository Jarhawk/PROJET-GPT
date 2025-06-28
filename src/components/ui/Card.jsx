export function Card({ title, children, className = '' }) {
  return (
    <div
      className={`bg-glass border border-borderGlass backdrop-blur rounded-2xl shadow-lg ${className}`}
    >
      {title && <h2 className="text-xl font-bold mb-4 p-6 pb-0">{title}</h2>}
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return <div className="p-6">{children}</div>;
}

export default Card;
