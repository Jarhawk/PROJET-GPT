// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { useZoneProducts } from '@/hooks/useZoneProducts';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function ZoneFormProducts({ zoneId }) {
  const { list, move } = useZoneProducts();
  const [rows, setRows] = useState([]);

  async function refresh() {
    if (!zoneId) return;
    const data = await list(zoneId);
    setRows(data);
  }

  useEffect(() => {
    refresh();
  }, [zoneId]);

  if (!zoneId) {
    return <p className="text-sm">Enregistrer la zone avant de gérer les produits.</p>;
  }

  async function handleMove() {
    const dst = window.prompt('Zone destination ?');
    if (!dst) return;
    const { error } = await move(zoneId, dst, true);
    if (!error) {
      toast.success('Déplacement effectué');
      refresh();
    }
  }

  return (
    <div>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Produit</th>
            <th className="px-2 py-1 text-left">Unité</th>
            <th className="px-2 py-1">Stock</th>
            <th className="px-2 py-1">Min</th>
            <th className="px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.id} className="border-t border-white/10">
              <td className="px-2 py-1">{p.produit_nom}</td>
              <td className="px-2 py-1">{p.unite_id}</td>
              <td className="px-2 py-1 text-right">{p.stock_reel}</td>
              <td className="px-2 py-1 text-right">{p.stock_min}</td>
              <td className="px-2 py-1">
                <Button size="sm" variant="outline" onClick={handleMove} data-testid="move-btn">
                  Déplacer
                </Button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center py-2">Aucun produit</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
