// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect, useMemo, useId } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AutoCompleteField({
  label,
  value,
  onChange,
  options,
  onAddNewValue,
  required = false,
  disabledOptions = [],
  className = "",
  optionsHook,
  enabled = true,
  minChars = 2,
  ...props
}) {
  const [inputValue, setInputValue] = useState(() => {
    const arr = Array.isArray(options) ? options : [];
    let match = null;
    for (const o of arr) {
      if (o.id === value || o.nom === value) {
        match = o;
        break;
      }
    }
    return match ? match.nom : value || "";
  });

  const { data: hookOptions = [] } = optionsHook
    ? optionsHook(inputValue, {
        enabled: enabled && inputValue.trim().length >= minChars,
      })
    : { data: [] };
  const allOptions = options ?? hookOptions;
  const resolved = useMemo(
    () => {
      const arr = Array.isArray(allOptions) ? allOptions : [];
      const result = [];
      for (const opt of arr) {
        result.push(typeof opt === "string" ? { id: opt, nom: opt } : opt);
      }
      return result;
    },
    [allOptions],
  );
  const [showAdd, setShowAdd] = useState(false);
  const listId = useId();

  useEffect(() => {
    const arr = Array.isArray(resolved) ? resolved : [];
    let match = null;
    for (const o of arr) {
      if (o.id === value || o.nom === value) {
        match = o;
        break;
      }
    }
    if (match) {
      setInputValue(match.nom);
    } else if (typeof value === "string") {
      setInputValue(value);
    }
  }, [value, resolved]);

  const disabledIds = (() => {
    const arr = Array.isArray(disabledOptions) ? disabledOptions : [];
    const ids = [];
    for (const d of arr) {
      ids.push(typeof d === "string" ? d : d.id);
    }
    return ids;
  })();

  const isValid = (() => {
    if (!inputValue) return false;
    const arr = Array.isArray(resolved) ? resolved : [];
    for (const o of arr) {
      if (
        o.nom.toLowerCase() === inputValue.toLowerCase() &&
        !disabledIds.includes(o.id)
      ) {
        return true;
      }
    }
    return false;
  })();

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const arr = Array.isArray(resolved) ? resolved : [];
    let match = null;
    for (const o of arr) {
      if (o.nom.toLowerCase() === val.toLowerCase()) {
        match = o;
        break;
      }
    }
    if (match) onChange(match);
    else onChange(val ? { id: null, nom: val } : { id: "", nom: "" });
    setShowAdd(val && !match && !!onAddNewValue);
  };

  const handleAddOption = async () => {
    if (inputValue && onAddNewValue) {
      const res = await onAddNewValue(inputValue);
      if (res && res.id) {
        onChange({ id: res.id, nom: res.nom || inputValue });
        setInputValue(res.nom || inputValue);
      } else {
        onChange({ id: null, nom: inputValue });
      }
      setShowAdd(false);
    }
  };

  const datalistOptions = (() => {
    const arr = Array.isArray(resolved) ? resolved : [];
    const elements = [];
    for (const opt of arr) {
      elements.push(<option key={opt.id} value={opt.nom} />);
    }
    return elements;
  })();


  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-sm text-white font-medium">
          {label} {required && "*"}
        </label>
      )}
      <Input
        list={listId}
        value={inputValue}
        onChange={handleInputChange}
        className={`${isValid ? "border-mamastockGold" : ""} ${className}`}
        aria-label={label}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (showAdd) handleAddOption();
          }
        }}
        {...props}
      />
      <datalist id={listId}>{datalistOptions}</datalist>
      {showAdd && onAddNewValue && (
        <Button
          type="button"
          size="sm"
          onClick={handleAddOption}
          className="mt-1 w-fit text-xs bg-mamastockGold text-black"
        >
          ➕ Ajouter "{inputValue}"
        </Button>
      )}
    </div>
  );
}
