import React from "react";

export default function Card({ children, hover = true, className = "" }) {
  return (
    <div
      className={`rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl transition-all duration-[var(--transition-base)] ${
        hover ? "hover:border-[var(--muted)] hover:shadow-[var(--shadow-xl)] hover:-translate-y-1 active:scale-[0.99]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}