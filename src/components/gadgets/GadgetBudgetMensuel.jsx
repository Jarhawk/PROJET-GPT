import { motion as Motion } from 'framer-motion';
import useBudgetMensuel from '@/hooks/gadgets/useBudgetMensuel';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetBudgetMensuel() {
  const { cible, reel, loading } = useBudgetMensuel();

  if (loading) return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  if (!cible && !reel)
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune donnée
      </div>
    );

  const progress = cible ? Math.min(100, (reel / cible) * 100) : 0;

  return (
    <div className="bg-glass border border-borderGlass backdrop-blur rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Budget mensuel</h3>
      <div className="text-sm mb-2">Cible : {cible.toFixed(0)} €</div>
      <div className="text-sm mb-2">Réel : {reel.toFixed(0)} €</div>
      <Motion.div className="w-full h-2 rounded bg-white/20 overflow-hidden">
        <Motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-2 bg-mamastock-gold"
        />
      </Motion.div>
    </div>
  );
}
