import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AutoCompleteField({
  label,
  value,
  onChange,
  options,
  onAddOption,
  required = false,
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [showAdd, setShowAdd] = useState(false);

  const optionsSafe = options ?? []; // Évite le crash si options est undefined
  const isValid = inputValue && optionsSafe.includes(inputValue);

  const handleInputChange = e => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setShowAdd(val && !optionsSafe.includes(val));
  };

  const handleAddOption = async () => {
    if (inputValue && onAddOption) {
      await onAddOption(inputValue);
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
        {optionsSafe.map((opt, idx) => (
          <option key={idx} value={opt} />
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
