import { motion as Motion } from 'framer-motion';
import useTachesUrgentes from '@/hooks/gadgets/useTachesUrgentes';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetTachesUrgentes() {
    const { data, loading } = useTachesUrgentes();
    const list = Array.isArray(data) ? data : [];

  if (loading) return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  if (!list.length)
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune tâche
      </div>
    );

  return (
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-md p-4 text-white">
        <h3 className="font-bold mb-2">Tâches urgentes</h3>
          <Motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-sm">
            {(() => {
              const rows = [];
              for (const t of list) {
                rows.push(
                  <li key={t.id} className="flex items-center justify-between">
                    <span>{t.titre}</span>
                    <span className="text-red-300">{t.date_echeance}</span>
                  </li>
                );
              }
              return rows;
            })()}
          </Motion.ul>
      </div>
  );
}
