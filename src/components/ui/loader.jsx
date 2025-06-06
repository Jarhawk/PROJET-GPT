// src/components/ui/Loader.jsx
import React from "react";

export default function Loader({ message = "Chargement en cours..." }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center space-y-2">
        <svg
          className="animate-spin h-8 w-8 text-mamastockGold"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <p className="text-sm text-mamastockText">{message}</p>
      </div>
    </div>
  );
}
