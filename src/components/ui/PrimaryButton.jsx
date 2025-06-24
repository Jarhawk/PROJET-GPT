export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`bg-gold hover:bg-[#d8b03c] text-black font-semibold rounded-xl px-4 py-2 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
