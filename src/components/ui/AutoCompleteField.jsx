// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
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
}) {
  const resolved = (options || []).map((opt) =>
    typeof opt === "string" ? { id: opt, nom: opt } : opt,
  );
  const [inputValue, setInputValue] = useState(() => {
    const match = resolved.find((o) => o.id === value);
    return match ? match.nom : "";
  });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const match = resolved.find((o) => o.id === value);
    setInputValue(match ? match.nom : "");
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
  const filtered = resolved.filter((o) => !disabledIds.includes(o.id));

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const match = resolved.find(
      (o) => o.nom.toLowerCase() === val.toLowerCase(),
    );
    if (match) onChange({ id: match.id, nom: match.nom });
    else onChange(val ? { id: null, nom: val } : { id: "", nom: "" });
    setShowAdd(val && !match);
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
      <label className="text-sm text-white font-medium">
        {label} {required && "*"}
      </label>
      <Input
        list={`list-${label}`}
        value={inputValue}
        onChange={handleInputChange}
        className={`${isValid ? "border-mamastockGold" : ""}`}
        aria-label={label}
        aria-autocomplete="list"
        role="combobox"
        aria-expanded={showAdd ? "true" : "false"}
      />
      <datalist id={`list-${label}`}>
        {filtered.map((opt, idx) => (
          <option key={idx} value={opt.nom} />
        ))}
      </datalist>
      {showAdd && (
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
