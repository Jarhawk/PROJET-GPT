// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMenuDuJour } from "@/hooks/useMenuDuJour";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export default function MenuDuJour() {
  const { fetchWeek } = useMenuDuJour();
  const { access_rights } = useAuth();
  const [startDate, setStartDate] = useState(getMonday(new Date()));
  const [resume, setResume] = useState([]);

  useEffect(() => {
    fetchWeek({ startDate }).then(setResume);
  }, [startDate, fetchWeek]);

  const changeWeek = (delta) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + delta * 7);
    setStartDate(getMonday(d));
  };

  const list = Array.isArray(resume) ? resume : [];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    let info = {};
    for (const r of list) {
      if (r.date_menu === iso) {
        info = r;
        break;
      }
    }
    days.push({ date: iso, info });
  }
  const daysList = Array.isArray(days) ? days : [];
  const dayLinks = [];
  for (const { date, info } of daysList) {
    dayLinks.push(
      <Link key={date} to={`/menu/${date}`} className="border p-2 rounded hover:bg-gray-50">
        <div className="font-semibold">{date}</div>
        <div className="text-sm mt-1">Coût: {info.cout_total ? info.cout_total.toFixed(2) : "-"} €</div>
      </Link>
    );
  }

  if (!access_rights?.menus_jour?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeWeek(-1)}>&lt;</button>
        <h1 className="text-xl font-bold">Menu du jour</h1>
        <button onClick={() => changeWeek(1)}>&gt;</button>
      </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {dayLinks}
        </div>
    </div>
  );
}
