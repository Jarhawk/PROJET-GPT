export default function Card({ title, children }) {
  return (
    <div className="bg-zinc-800 text-white rounded-2xl shadow-lg p-6">
      {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
      {children}
    </div>
  );
}
