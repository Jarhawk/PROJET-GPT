// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from "react";

export default function TableContainer({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white/5 text-white border border-white/10 rounded-xl overflow-x-auto ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

