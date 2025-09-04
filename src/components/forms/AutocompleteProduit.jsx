import { useState, useRef, useEffect, useId, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useProduitsSearch } from '@/hooks/useProduitsSearch';
import useDebounce from '@/hooks/useDebounce';
import ProductPickerModal from './ProductPickerModal';

function AutocompleteProduit(
  { value, onChange, required = false, placeholder = '', className = '', lineKey = 0, onFocus },
  ref
) {
  const [inputValue, setInputValue] = useState(value?.nom || '');
  const [selected, setSelected] = useState(value?.id ? value : null);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const composing = useRef(false);
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => inputRef.current);
  const listId = useId();
  const nameId = useId();

  const { mama_id: mamaId } = useAuth();
  const { data: options = [] } = useProduitsSearch(search, mamaId, {
    enabled: open || modalOpen,
  });

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.setAttribute('autocomplete', 'off');
      el.setAttribute('autocorrect', 'off');
      el.setAttribute('autocapitalize', 'none');
      el.setAttribute('spellcheck', 'false');
      el.setAttribute('data-lpignore', 'true');
      el.setAttribute('data-form-type', 'other');
      el.setAttribute('enterkeyhint', 'search');
      el.name = `prod-${nameId}`;
    }
  }, [nameId]);

  // Reset when line changes
  useEffect(() => {
    setInputValue(value?.nom || '');
    setSelected(value?.id ? value : null);
    setSearch('');
    setOpen(false);
    setActive(-1);
  }, [lineKey, value?.id, value?.nom]);

  const debouncedInput = useDebounce(inputValue, 250);

  useEffect(() => {
    if (composing.current) return;
    const val = debouncedInput.trim();
    if (val.length < 2) {
      setSearch('');
      setOpen(false);
      return;
    }
    setSearch(val);
    setOpen(true);
  }, [debouncedInput]);

  useEffect(() => {
    setActive(-1);
  }, [options]);

  const handleInput = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange?.({ id: '', nom: val });
  };

  const select = (prod) => {
    if (!prod) return;
    setInputValue(prod.nom);
    setSelected(prod);
    setOpen(false);
    setActive(-1);
    setSearch('');
    onChange?.(prod);
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
    if (!selected || inputValue !== selected.nom) {
      setInputValue('');
      setSelected(null);
      setSearch('');
      onChange?.({ id: '', nom: '' });
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInput}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          setInputValue(e.target.value);
        }}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        onFocus={onFocus}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          active >= 0 ? `${listId}-opt-${active}` : undefined
        }
        placeholder={placeholder}
        required={required}
        className={className}
      />
      <button
        type="button"
        aria-label="Sélecteur de produits"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1"
        onClick={() => setModalOpen(true)}
      >
        🔍
      </button>
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
      <ProductPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(p) => {
          select(p);
        }}
      />
    </div>
  );
}

export default forwardRef(AutocompleteProduit);
