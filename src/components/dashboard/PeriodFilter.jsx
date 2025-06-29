// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export default function PeriodFilter({ onChange, initialStart, initialEnd }) {
  const [start, setStart] = useState(initialStart || "");
  const [end, setEnd] = useState(initialEnd || "");

  const update = (s, e) => {
    setStart(s);
    setEnd(e);
    onChange?.(s, e);
  };

  return (
    <div className="flex gap-2 items-center">
      <label>
        Du :
        <input
          type="date"
          value={start}
          onChange={e => update(e.target.value, end)}
          className="input"
        />
      </label>
      <label>
        Au :
        <input
          type="date"
          value={end}
          onChange={e => update(start, e.target.value)}
          className="input"
        />
      </label>
      <button
        className="btn btn-sm"
        onClick={() => update(getToday(), getToday())}
      >Aujourd'hui</button>
      <button
        className="btn btn-sm"
        onClick={() => update(getMonthStart(), getToday())}
      >Mois en cours</button>
      <button
        className="btn btn-sm"
        onClick={() => update(
          new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
          getToday()
        )}
      >7 jours</button>
    </div>
  );
}
