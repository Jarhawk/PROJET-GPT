import { motion as Motion } from 'framer-motion';
import useTachesUrgentes from '@/hooks/gadgets/useTachesUrgentes';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetTachesUrgentes() {
  const { data, loading } = useTachesUrgentes();

  if (loading) return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  if (!data.length)
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune tâche
      </div>
    );

  return (
    <div className="bg-glass border border-borderGlass backdrop-blur rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Tâches urgentes</h3>
      <Motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-sm">
        {data.map((t) => (
          <li key={t.id} className="flex items-center justify-between">
            <span>{t.titre}</span>
            <span className="text-red-300">{t.date_echeance}</span>
          </li>
        ))}
      </Motion.ul>
    </div>
  );
}
