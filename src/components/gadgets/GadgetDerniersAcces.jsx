import { motion as Motion } from 'framer-motion';
import useDerniersAcces from '@/hooks/gadgets/useDerniersAcces';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetDerniersAcces() {
  const { data, loading } = useDerniersAcces();

  if (loading) return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  if (!data.length)
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune donnée
      </div>
    );

  return (
    <div className="bg-glass border border-borderGlass backdrop-blur rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Derniers accès</h3>
      <Motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-sm">
        {data.map((u) => (
          <li key={u.id} className="flex items-center justify-between">
            <span>{u.email}</span>
            <span>{new Date(u.date).toLocaleString()}</span>
          </li>
        ))}
      </Motion.ul>
    </div>
  );
}
