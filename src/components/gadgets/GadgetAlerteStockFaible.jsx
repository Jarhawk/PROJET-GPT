import { motion as Motion } from 'framer-motion';
import useAlerteStockFaible from '@/hooks/gadgets/useAlerteStockFaible';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetAlerteStockFaible() {
  const { data, loading } = useAlerteStockFaible();

  if (loading) return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  if (!data.length)
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune donnée
      </div>
    );

  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Alerte stock faible</h3>
      <Motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-sm">
        {data.map((p) => (
          <li key={p.produit_id} className="flex items-center justify-between">
            <span>{p.nom}</span>
            <span className="text-red-300">
              {p.stock_reel} / {p.stock_min}
            </span>
          </li>
        ))}
      </Motion.ul>
    </div>
  );
}
