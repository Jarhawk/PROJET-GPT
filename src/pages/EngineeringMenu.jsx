// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import usePerformanceFiches from '@/hooks/usePerformanceFiches';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function EngineeringMenu() {
  const { access_rights, mama_id, loading: authLoading } = useAuth();
  const { data, fetchData, loading } = usePerformanceFiches();

  useEffect(() => { if (mama_id) fetchData(); }, [mama_id, fetchData]);

  if (authLoading || loading) return <LoadingSpinner message="Chargement..." />;
  if (!access_rights?.analyse?.peut_voir) return <Navigate to="/unauthorized" replace />;

  return (
    <div className="p-6 space-y-4 text-shadow">
      <h1 className="text-2xl font-bold">Engineering Menu</h1>
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="px-2 py-1">Nom</th>
            <th className="px-2 py-1">Coût</th>
            <th className="px-2 py-1">Volume</th>
            <th className="px-2 py-1">Popularité</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.fiche_id || row.id}>
              <td className="px-2 py-1">{row.nom}</td>
              <td className="px-2 py-1">{row.cout ? Number(row.cout).toFixed(2) : '-'}</td>
              <td className="px-2 py-1">{row.volume}</td>
              <td className="px-2 py-1">{(Number(row.popularite) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
