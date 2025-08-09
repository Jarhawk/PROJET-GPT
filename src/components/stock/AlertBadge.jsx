// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAlerts } from "@/hooks/useAlerts";

export default function AlertBadge() {
  const { fetchAlerts } = useAlerts();
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchAlerts(null, false).then((data) => setCount(data.length));
  }, [fetchAlerts]);

  if (count === 0) return null;

  return (
    <Link to="/stock/alertes-rupture" className="relative">
      <AlertTriangle size={20} />
      <Badge color="red" className="absolute -top-1 -right-1">
        {count}
      </Badge>
    </Link>
  );
}
