// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMenuDuJour } from "@/hooks/useMenuDuJour";

export default function MenuDuJour() {
  const { fetchWeek } = useMenuDuJour();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday start
    d.setDate(d.getDate() + diff);
    return d;
  });
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchWeek({ startDate }).then(setData);
  }, [startDate]);

  const byDate = Object.fromEntries((data || []).map((d) => [d.date_menu, d]));
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  const prevWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    setStartDate(d);
  };
  const nextWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    setStartDate(d);
  };

  const fmt = (d) => d.toISOString().slice(0, 10);

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <button onClick={prevWeek}>←</button>
        <h2 className="font-semibold">Semaine du {fmt(startDate)}</h2>
        <button onClick={nextWeek}>→</button>
      </div>
      <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4">
        {days.map((d) => {
          const key = fmt(d);
          const resume = byDate[key];
          return (
            <Link key={key} to={`/menu/${key}`} className="border p-2 rounded block">
              <div className="font-medium">{key}</div>
              <div className="text-sm">
                {resume ? `${resume.cout_total?.toFixed(2)} €` : "-"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
