// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from "react";

export default function TableContainer({ className = "", children, ...props }) {
  const enhanced = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === "table") {
      const childClass = child.props.className || "";
      return React.cloneElement(child, {
        className: `listing-table ${childClass}`.trim(),
      });
    }
    return child;
  });

  return (
    <div
      className={`w-full bg-white/5 backdrop-blur p-4 text-white border border-white/10 rounded-xl shadow-lg overflow-x-auto ${className}`}
      {...props}
    >
      {enhanced}
    </div>
  );
}

