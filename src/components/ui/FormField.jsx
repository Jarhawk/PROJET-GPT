// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { idFromLabel } from "@/utils/formIds";
import React from "react";

export function FormField({ label, htmlFor, required, help, error, children, full = false }) {
  const child = React.Children.only(children);
  const cid = child.props.id ?? htmlFor ?? idFromLabel(label);
  const described = error ? `err-${cid}` : undefined;
  const cloned = React.cloneElement(child, {
    id: cid,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
  });
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      {label && (
        <label htmlFor={cid} className="mb-1 block text-sm font-medium text-gray-800">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      )}
      <div className="relative">{cloned}</div>
      {help && !error && <p className="mt-1 text-xs text-gray-500">{help}</p>}
      {error && (
        <p id={`err-${cid}`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
