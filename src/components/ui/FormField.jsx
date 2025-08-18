// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { idFromLabel } from "@/utils/formIds";
import React from "react";

export function FormField(props) {
  const { label, required, help, error, children, full = false } = props;
  const reactId =
    typeof React.useId === "function"
      ? React.useId()
      : `uid-${Math.random().toString(36).slice(2, 8)}`;
  const fieldId = props.id || `${idFromLabel(label)}-${reactId.slice(-4)}`;

  const child = React.Children.only(children);
  const described = error ? `err-${fieldId}` : undefined;
  const cloned = React.cloneElement(child, {
    id: fieldId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
  });
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      {label && (
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-gray-800">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      )}
      <div className="relative">{cloned}</div>
      {help && !error && <p className="mt-1 text-xs text-gray-500">{help}</p>}
      {error && (
        <p id={`err-${fieldId}`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
