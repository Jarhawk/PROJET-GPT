import { motion as Motion } from 'framer-motion';
import useTopFournisseurs from '@/hooks/gadgets/useTopFournisseurs';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetTopFournisseurs() {
  const { data, loading } = useTopFournisseurs();

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
    <div className="bg-glass border border-borderGlass backdrop-blur rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Top fournisseurs du mois</h3>
      <Motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-sm">
        {data.map((f) => (
          <li key={f.id} className="flex items-center justify-between">{/* ✅ Correction Codex */}
            <div className="flex items-center gap-2">
              <span>Fournisseur {f.id}</span>{/* ✅ Correction Codex */}
            </div>
            <span className="font-semibold">{f.montant.toFixed(2)} €</span>{/* ✅ Correction Codex */}
          </li>
        ))}
      </Motion.ul>
    </div>
  );
}
