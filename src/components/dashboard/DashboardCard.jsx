import { motion } from "framer-motion";

export default function DashboardCard({ icon: Icon, title, value }) {
  return (
    <motion.div
      className="bg-white/10 border border-mamastock-gold rounded-xl p-6 shadow hover:bg-white/20 transition text-white"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm text-gray-300 uppercase font-medium">{title}</h2>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {Icon && <Icon className="w-8 h-8 text-mamastock-gold" />}
      </div>
    </motion.div>
  );
}
