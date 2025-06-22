export function Card({ title, children }) {
  return (
    <div className="bg-zinc-800 text-white rounded-2xl shadow-lg">
      {title && <h2 className="text-xl font-bold mb-4 p-6 pb-0">{title}</h2>}
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return <div className="p-6">{children}</div>;
}

export default Card;
