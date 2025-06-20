// src/components/ui/card.jsx
import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={
        "rounded-xl shadow-md bg-glass backdrop-blur-lg p-4 text-white " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={"p-2 text-white " + className} {...props}>
      {children}
    </div>
  );
}
