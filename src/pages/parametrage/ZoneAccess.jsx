// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useZoneRights } from '@/hooks/useZoneRights';
import { useZones } from '@/hooks/useZones';
import { toast } from 'sonner';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ZoneAccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchZoneRights, setUserRights, removeUserRights } = useZoneRights();
  const { fetchZoneById } = useZones();
  const [zone, setZone] = useState(null);
  const [rights, setRights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [params, setParams] = useState({
    lecture: true,
    ecriture: false,
    transfert: false,
    requisition: false,
  });

  useEffect(() => {
    async function load() {
      const z = await fetchZoneById(id);
      setZone(z);
      const r = await fetchZoneRights(id);
      setRights(r);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleAdd = async () => {
    if (!userId) return;
    const { error } = await setUserRights({
      zone_id: id,
      user_id: userId,
      ...params,
    });
    if (!error) {
      toast.success('Droits mis à jour');
      setRights(await fetchZoneRights(id));
      setUserId('');
    }
  };

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <GlassCard title={`Droits - ${zone?.nom || ''}`}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={params.lecture}
                onChange={(e) =>
                  setParams((p) => ({ ...p, lecture: e.target.checked }))
                }
              />
              Lecture
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={params.ecriture}
                onChange={(e) =>
                  setParams((p) => ({ ...p, ecriture: e.target.checked }))
                }
              />
              Écriture
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={params.transfert}
                onChange={(e) =>
                  setParams((p) => ({ ...p, transfert: e.target.checked }))
                }
              />
              Transfert
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={params.requisition}
                onChange={(e) =>
                  setParams((p) => ({ ...p, requisition: e.target.checked }))
                }
              />
              Réquisition
            </label>
            <Button onClick={handleAdd}>Ajouter</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            La réquisition sera effective uniquement si la zone est de type cave
            ou shop.
          </p>
          <ul className="space-y-2">
            {rights.map((r) => (
              <li
                key={r.id}
                className="flex justify-between items-center text-sm"
              >
                <span>{r.user_id}</span>
                <span className="text-xs">
                  L:{r.lecture ? '✔' : '✖'} E:{r.ecriture ? '✔' : '✖'} T:
                  {r.transfert ? '✔' : '✖'} R:{r.requisition ? '✔' : '✖'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await removeUserRights(r.id);
                    setRights(await fetchZoneRights(id));
                  }}
                >
                  Supprimer
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => navigate('/parametrage/zones')}
            >
              Fermer
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
