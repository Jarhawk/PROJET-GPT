import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useRuptureAlerts } from "@/hooks/useRuptureAlerts";

export default function AlertBadge() {
  const { fetchAlerts } = useRuptureAlerts();
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchAlerts(null, false).then(a => setCount(a.length)).catch(() => {});
  }, [fetchAlerts]);

  return (
    <Link to="/stock/alertes" className="relative" aria-label="Alertes stock">
      <Bell />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">
          {count}
        </span>
      )}
    </Link>
  );
}
