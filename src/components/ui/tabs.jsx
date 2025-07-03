// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/ui/tabs.jsx

export function Tabs({ children }) {
  return <div>{children}</div>;
}

export function TabsList({ children }) {
  return <div className="flex border-b border-mamastock-gold mb-2">{children}</div>;
}

export function TabsTrigger({ children, onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors duration-200 ${
        isActive
          ? 'border-mamastock-gold text-mamastock-gold'
          : 'border-transparent text-mamastock-text hover:text-mamastock-gold'
      }`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, isActive }) {
  return isActive ? <div className="p-4">{children}</div> : null;
}
