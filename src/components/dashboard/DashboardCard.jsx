import { motion } from "framer-motion";

export default function DashboardCard({ title, value, icon, type = "default", progress = null, children }) {
  const colorClass = {
    default: "bg-white text-mamastockText",
    stock: "bg-blue-50 text-blue-800",
    ca: "bg-green-50 text-green-800",
    cost: "bg-orange-50 text-orange-800",
    alert: "bg-red-50 text-red-800"
  }[type] || "bg-white text-mamastockText";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl shadow-md p-4 flex flex-col items-center min-w-[180px] ${colorClass}`}
    >
      <div className="flex items-center space-x-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="font-bold text-xl">{title}</span>
      </div>
      <div className="text-3xl font-extrabold my-2">{value}</div>
      {progress !== null &&
        <div className="w-full h-2 rounded bg-gray-200 mt-1">
          <div className="h-2 rounded bg-mamastockGold" style={{ width: `${progress}%` }} />
        </div>
      }
      {children && <div className="w-full mt-2">{children}</div>}
    </motion.div>
  );
}
