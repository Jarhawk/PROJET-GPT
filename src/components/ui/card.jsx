// src/components/ui/card.jsx
import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={
        "rounded-2xl shadow-xl bg-white/60 dark:bg-[#222a38]/60 border border-white/30 backdrop-blur-md p-6 " +
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
    <div className={"p-2 " + className} {...props}>
      {children}
    </div>
  );
}
