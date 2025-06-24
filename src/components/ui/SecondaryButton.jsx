export default function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`border border-white/50 text-white rounded-xl px-4 py-2 hover:bg-white/10 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
