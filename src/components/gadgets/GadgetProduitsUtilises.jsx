import { motion as Motion } from 'framer-motion';
import useProduitsUtilises from '@/hooks/gadgets/useProduitsUtilises';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetProduitsUtilises() {
  const { data, loading } = useProduitsUtilises();

  if (loading) return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  if (!data.length)
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune donnée
      </div>
    );

  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Produits les plus utilisés</h3>
      <Motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-sm">
        {data.map((p) => (
          <li key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/icons/icon-128x128.png"
                alt={p.nom}
                className="w-6 h-6 rounded object-cover"
              />
              <span>{p.nom}</span>
            </div>
            <span className="font-semibold">{p.total}</span>
          </li>
        ))}
      </Motion.ul>
    </div>
  );
}
