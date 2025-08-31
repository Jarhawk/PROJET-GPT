import { motion as Motion } from 'framer-motion';
import useTopFournisseurs from '@/hooks/gadgets/useTopFournisseurs';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Card from '@/components/ui/Card';
import { formatCurrencyEUR } from '@/lib/numberFormat';

export default function GadgetTopFournisseurs() {
  const { data, loading, error: errTop } = useTopFournisseurs();
  const list = Array.isArray(data) ? data : [];

  if (loading) {
    return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  }
  if (errTop) return <Card>Erreur chargement top fournisseurs</Card>;
  if (!list.length) {
    return <Card className="p-4 text-center">Aucune donnée</Card>;
  }

  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Top fournisseurs du mois</h3>
      <Motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2 text-sm"
      >
        {
          (() => {
            const items = [];
            for (const f of list) {
              items.push(
                <li
                  key={f.fournisseur_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>{f.nom}</span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrencyEUR(Number(f.montant))}
                  </span>
                </li>
              );
            }
            return items;
          })()
        }
      </Motion.ul>
    </div>
  );
}
