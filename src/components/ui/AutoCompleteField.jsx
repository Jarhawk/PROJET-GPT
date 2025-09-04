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
    const match = (options || []).find(o => o.id === value || o.nom === value);
    return match ? match.nom : value || "";
  });

  const { data: hookOptions = [] } = optionsHook
    ? optionsHook(inputValue, {
        enabled: enabled && inputValue.trim().length >= minChars,
      })
    : { data: [] };
  const allOptions = options ?? hookOptions;
  const resolved = useMemo(
    () => (allOptions || []).map((opt) => (typeof opt === "string" ? { id: opt, nom: opt } : opt)),
    [allOptions],
  );
  const [showAdd, setShowAdd] = useState(false);
  const listId = useId();

  useEffect(() => {
    const match = resolved.find(o => o.id === value || o.nom === value);
    if (match) {
      setInputValue(match.nom);
    } else if (typeof value === "string") {
      setInputValue(value);
    }
  }, [value, resolved]);

  const disabledIds = disabledOptions.map((d) =>
    typeof d === "string" ? d : d.id,
  );

  const isValid =
    inputValue &&
    resolved.some(
      (o) =>
        o.nom.toLowerCase() === inputValue.toLowerCase() &&
        !disabledIds.includes(o.id),
    );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const match = resolved.find(
      (o) => o.nom.toLowerCase() === val.toLowerCase(),
    );
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
      <datalist id={listId}>
        {resolved.map(opt => (
          <option key={opt.id} value={opt.nom} />
        ))}
      </datalist>
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
