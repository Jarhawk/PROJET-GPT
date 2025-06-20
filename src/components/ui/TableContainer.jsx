import React from "react";

export default function TableContainer({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-lg rounded-xl shadow-md overflow-x-auto ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

