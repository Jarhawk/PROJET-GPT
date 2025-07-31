import { motion as Motion } from 'framer-motion';
import useConsoMoyenne from '@/hooks/gadgets/useConsoMoyenne';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetConsoMoyenne() {
  const { avg, loading } = useConsoMoyenne();

  if (loading) return <LoadingSkeleton className="h-24 w-full rounded-2xl" />;
  if (!avg)
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune donnée
      </div>
    );

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-md p-4 text-center text-white"
    >
      <h3 className="font-bold mb-2">Consommation moyenne / jour</h3>
      <div className="text-3xl font-extrabold">{avg.toFixed(2)}</div>
    </Motion.div>
  );
}
