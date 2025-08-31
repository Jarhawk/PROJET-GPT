import { useEffect, useRef, useState } from 'react';
import { useFournisseursAutocomplete } from '@/hooks/useFournisseursAutocomplete';

export default function SupplierFilter({ value, onChange, placeholder = 'Rechercher un fournisseur' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const { options: results = [], loading } = useFournisseursAutocomplete({ term: query });
  const list = Array.isArray(results) ? results : [];

  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  const handleSelect = (item) => {
    onChange?.(item); // { id, nom }
    setOpen(false);
  };

  const clear = () => {
    onChange?.(null);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 rounded-md border border-slate-600 bg-slate-800/60 px-3 h-10">
        <span aria-hidden className="opacity-70">🔍</span>
        <input
          ref={inputRef}
          value={value ? value.nom : query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="bg-transparent outline-none w-full placeholder:opacity-60"
        />
        {value && (
          <button type="button" onClick={clear} className="opacity-70 hover:opacity-100">✕</button>
        )}
      </div>

      {open && !value && (query.trim().length > 0 || loading) && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-600 bg-slate-800 shadow-lg max-h-56 overflow-auto">
          {loading && <div className="px-3 py-2 text-sm opacity-70">Recherche…</div>}
          {!loading && (Array.isArray(list) && list.length ? (
            (() => {
              const rows = [];
              for (const r of list) {
                rows.push(
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect({ id: r.id, nom: r.nom })}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700"
                  >
                    {r.nom}
                  </button>
                );
              }
              return rows;
            })()
          ) : (
            <div className="px-3 py-2 text-sm opacity-70">Aucun résultat</div>
          ))}
        </div>
      )}
    </div>
  );
}

