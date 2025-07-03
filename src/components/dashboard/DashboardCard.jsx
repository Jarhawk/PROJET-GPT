// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { motion as Motion } from "framer-motion";

export default function DashboardCard({ title, value, icon, type = "default", progress = null, children }) {
  const colorClass = {
    default: "text-white",
    stock: "text-blue-200",
    ca: "text-green-200",
    cost: "text-orange-200",
    alert: "text-red-200"
  }[type] || "text-white";

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-glass border border-borderGlass backdrop-blur rounded-2xl shadow-md p-4 flex flex-col items-center min-w-[180px] ${colorClass}`}
    >
      <div className="flex items-center space-x-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="font-bold text-xl">{title}</span>
      </div>
      <div className="text-3xl font-extrabold my-2">{value}</div>
      {progress !== null &&
        <div className="w-full h-2 rounded bg-white/20 mt-1">
          <div className="h-2 rounded bg-mamastockGold" style={{ width: `${progress}%` }} />
        </div>
      }
      {children && <div className="w-full mt-2">{children}</div>}
    </Motion.div>
  );
}
