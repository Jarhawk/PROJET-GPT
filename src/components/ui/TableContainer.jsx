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

