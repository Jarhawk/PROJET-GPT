export function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold shadow transition-all"
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
