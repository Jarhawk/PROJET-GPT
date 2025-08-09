// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.

export default function TableHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`flex flex-col md:flex-row gap-2 md:gap-4 items-end w-full mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
