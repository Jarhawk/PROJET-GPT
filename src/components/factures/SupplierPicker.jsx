import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/useDebounce';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFournisseursAutocomplete } from '@/hooks/useFournisseursAutocomplete';
import useFournisseursRecents from '@/hooks/useFournisseursRecents';
import SupplierBrowserModal from './SupplierBrowserModal';

export default function SupplierPicker({ value, onChange, error }) {
  const { mama_id } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef(null);

  const debounced = useDebounce(search, 250);
  const { options: autoOptions = [] } = useFournisseursAutocomplete({ term: debounced });
  const { data: recents = [] } = useFournisseursRecents();

  const options = search.trim() ? autoOptions : recents;

  useEffect(() => {
    setActive(-1);
  }, [options]);

  useEffect(() => {
    if (!value) {
      setInputValue('');
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      const { data } = await supabase
        .from('fournisseurs')
        .select('id, nom')
        .eq('mama_id', mama_id)
        .eq('id', value)
        .single();
      if (!cancelled) setInputValue(data?.nom || '');
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [value, mama_id]);

  const handleInput = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setSearch(val);
    setOpen(true);
  };

  const select = (f) => {
    setInputValue(f.nom);
    setSearch('');
    setOpen(false);
    onChange?.(f.id);
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
    } else if (e.key === 'F2') {
      e.preventDefault();
      setModalOpen(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
      setActive(-1);
    }, 100);
    if (!value || inputValue.trim() === '') {
      setInputValue('');
      setSearch('');
      onChange?.(null);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInput}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        placeholder="Rechercher un fournisseur"
        className={`${error ? 'border-destructive' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
      />
      <button
        type="button"
        aria-label="Sélecteur de fournisseurs"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1"
        onClick={() => setModalOpen(true)}
      >
        🔍
      </button>
      {open && options.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-white/20 bg-neutral-800 text-white">
          {options.map((opt, idx) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={idx === active}
              className={`px-2 py-1 cursor-pointer ${idx === active ? 'bg-white/20' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(opt);
              }}
            >
              {opt.nom}
            </li>
          ))}
        </ul>
      )}
      <SupplierBrowserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(f) => {
          select(f);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

