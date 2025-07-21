// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AutoCompleteField({
  label,
  value,
  onChange,
  options,
  onAddOption,
  required = false,
  disabledOptions = [],
}) {
  const resolved = (options || []).map(opt =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );
  const [inputValue, setInputValue] = useState(() => {
    const match = resolved.find(o => o.value === value);
    return match ? match.label : "";
  });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const match = resolved.find(o => o.value === value);
    setInputValue(match ? match.label : "");
  }, [value, resolved]);

  const disabledIds = disabledOptions.map(d =>
    typeof d === "string" ? d : d.value
  );

  const isValid =
    inputValue && resolved.some(o => o.label === inputValue && !disabledIds.includes(o.value));
  const filtered = resolved.filter(o => !disabledIds.includes(o.value));

  const handleInputChange = e => {
    const val = e.target.value;
    setInputValue(val);
    const match = resolved.find(o => o.label === val);
    onChange(match ? match.value : null);
    setShowAdd(val && !match);
  };

  const handleAddOption = async () => {
    if (inputValue && onAddOption) {
      const res = await onAddOption(inputValue);
      if (res && res.id) {
        onChange(res.id);
        setInputValue(res.label || inputValue);
      }
      setShowAdd(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm text-white font-medium">
        {label} {required && "*"}
      </label>
      <Input
        list={`list-${label}`}
        value={inputValue}
        onChange={handleInputChange}
        className={`bg-white/20 dark:bg-[#202638]/50 backdrop-blur rounded-lg border border-white/30 text-white ${isValid ? "border-mamastockGold shadow" : ""}`}
        aria-label={label}
        aria-autocomplete="list"
        role="combobox"
        aria-expanded={showAdd ? "true" : "false"}
      />
      <datalist id={`list-${label}`}>
        {filtered.map((opt, idx) => (
          <option key={idx} value={opt.label} />
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
