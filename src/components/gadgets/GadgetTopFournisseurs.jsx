import { motion as Motion } from 'framer-motion';
import useTopFournisseurs from '@/hooks/gadgets/useTopFournisseurs';
import useFournisseurs from '@/hooks/data/useFournisseurs';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetTopFournisseurs() {
  const { data, loading } = useTopFournisseurs();
  const { data: fournisseurs = [] } = useFournisseurs({ actif: true });

  const nameFor = (id) =>
    fournisseurs.find((f) => f.id === id)?.nom || `Fournisseur ${id}`;

  if (loading) {
    return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  }
  if (!data.length) {
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune donnée
      </div>
    );
  }

  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Top fournisseurs du mois</h3>
      <Motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-sm">
        {data.map((f) => (
          <li key={f.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{nameFor(f.id)}</span>
            </div>
            <span className="font-semibold">{f.montant_total.toFixed(2)} €</span>
          </li>
        ))}
      </Motion.ul>
    </div>
  );
}
