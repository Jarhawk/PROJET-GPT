import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import useEvolutionAchats from '@/hooks/gadgets/useEvolutionAchats';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function GadgetEvolutionAchats() {
  const { data, loading } = useEvolutionAchats();

  if (loading) return <LoadingSkeleton className="h-40 w-full rounded-2xl" />;
  if (!data.length)
    return (
      <div className="bg-white/10 rounded-2xl p-4 text-center text-white">
        Aucune donnée
      </div>
    );

  return (
    <div className="bg-glass border border-borderGlass backdrop-blur rounded-2xl shadow-md p-4 text-white">
      <h3 className="font-bold mb-2">Évolution des achats</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: -10, right: 10 }}>
          <Line type="monotone" dataKey="montant" stroke="#F6C343" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
