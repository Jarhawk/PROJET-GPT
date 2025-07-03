// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from "react";

export default function TableContainer({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-glass border border-borderGlass backdrop-blur-lg rounded-xl shadow-md overflow-x-auto ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

