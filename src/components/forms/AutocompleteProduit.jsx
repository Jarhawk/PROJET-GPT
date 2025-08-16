import { useState, useRef, useEffect, useId } from 'react';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function AutocompleteProduit({
  value,
  onChange,
  required = false,
  placeholder = '',
  className = '',
}) {
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const [inputValue, setInputValue] = useState(value?.nom || '');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const abortRef = useRef();
  const debounceRef = useRef();
  const composing = useRef(false);
  const inputRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    setInputValue(value?.nom || '');
  }, [value?.id, value?.nom]);

  const normalize = (list) =>
    (list || []).map((p) => ({
      id: p.id,
      nom: p.nom,
      code: p.code,
      unite_achat: p.unite_achat || p.unite,
      tva: p.tva ?? p.tva_rate,
      zone_id: p.zone_id ?? p.zone_stock_id,
      pmp: p.pmp ?? p.pmp_ht,
      prix_unitaire:
        p.prix_unitaire ?? p.price_ht ?? p.dernier_prix ?? 0,
    }));

  const fetchProduits = async (q, signal) => {
    if (!mamaId) return [];
    if (!q) return [];
    q = q.trim();
    try {
      const { data, error } = await supabase.rpc('search_produits', { q }, { signal });
      if (!error && !signal.aborted) return normalize(data).slice(0, 20);
    } catch (e) {
      if (e.name === 'AbortError') throw e;
    }
    const tables = ['v_produits_actifs', 'produits'];
    for (const t of tables) {
      try {
        let rq = supabase
          .from(t)
          .select(
            'id, nom, code, unite_achat, unite, tva, tva_rate, zone_id, zone_stock_id, pmp, pmp_ht, prix_unitaire, price_ht, dernier_prix'
          )
          .eq('mama_id', mamaId)
          .limit(20);
        try { rq = rq.eq('actif', true); } catch {}
        rq = rq.or(`nom.ilike.%${q}%,code.ilike.%${q}%`);
        rq = rq.order('nom', { ascending: true });
        const { data, error } = await rq;
        if (!error && !signal.aborted) return normalize(data);
      } catch (e) {
        if (e.name === 'AbortError') throw e;
      }
    }
    return [];
  };

  const triggerSearch = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    if (!q) { setOptions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetchProduits(q, controller.signal);
        if (!controller.signal.aborted) {
          setOptions(res);
          setOpen(true);
          setActive(-1);
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
      }
    }, 250);
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange?.({ id: '', nom: val });
    if (!composing.current) triggerSearch(val);
  };

  const select = (opt) => {
    if (!opt) return;
    setInputValue(opt.nom);
    setOpen(false);
    setActive(-1);
    onChange?.(opt);
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && active >= 0) {
        e.preventDefault();
        select(options[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Tab') {
      if (open && active >= 0) select(options[active]);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 100);
    if (!inputValue) onChange?.({ id: '', nom: '' });
  };

  return (
    <div className="relative" ref={inputRef}>
      <Input
        value={inputValue}
        onChange={handleInput}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={(e) => { composing.current = false; triggerSearch(e.target.value); }}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-white/20 bg-neutral-800 text-white"
        >
          {options.map((opt, idx) => (
            <li
              key={opt.id}
              id={`${listId}-opt-${idx}`}
              role="option"
              aria-selected={idx === active}
              className={`px-2 py-1 cursor-pointer ${idx === active ? 'bg-white/20' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); select(opt); }}
            >
              {opt.nom}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

