// src/components/dashboard/PeriodFilter.jsx
export default function PeriodFilter({ period, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-mamastock-gold mb-1">
        Période
      </label>
      <input
        type="month"
        value={period}
        onChange={(e) => onChange?.(e.target.value)}
        className="border border-[var(--mamastock-border)] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mamastock-gold"
      />
    </div>
  );
}
