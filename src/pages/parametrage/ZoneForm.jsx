// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useZones } from '@/hooks/useZones';
import { toast } from 'react-hot-toast';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ZoneForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchZoneById, createZone, updateZone, fetchZones } = useZones();
  const [zone, setZone] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await fetchZones();
      setZones(all);
      if (id && id !== 'new') {
        const z = await fetchZoneById(id);
        setZone(z);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSubmit = async e => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      nom: form.nom.value.trim(),
      type: form.type.value,
      code: form.code.value.trim() || null,
      parent_id: form.parent_id.value || null,
      adresse: form.adresse.value.trim() || null,
      actif: form.actif.checked,
      position: parseInt(form.position.value || '0', 10),
    };
    const { error } = id === 'new' ? await createZone(payload) : await updateZone(id, payload);
    if (!error) {
      toast.success('Zone enregistrée');
      navigate('/parametrage/zones');
    }
  };

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <GlassCard title={id === 'new' ? 'Nouvelle zone' : 'Modifier la zone'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="nom">Nom</label>
            <Input id="nom" name="nom" defaultValue={zone?.nom || ''} required />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="type">Type</label>
            <Select id="type" name="type" defaultValue={zone?.type || ''} required className="w-full">
              <option value="">Choisir…</option>
              <option value="cave">Cave</option>
              <option value="shop">Shop</option>
              <option value="cuisine">Cuisine</option>
              <option value="bar">Bar</option>
              <option value="entrepot">Entrepôt</option>
              <option value="autre">Autre</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="code">Code</label>
            <Input id="code" name="code" defaultValue={zone?.code || ''} />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="parent_id">Parent</label>
            <Select id="parent_id" name="parent_id" defaultValue={zone?.parent_id || ''} className="w-full">
              <option value="">Aucun</option>
              {zones.filter(z => z.id !== id).map(z => (
                <option key={z.id} value={z.id}>{z.nom}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="adresse">Adresse</label>
            <Input id="adresse" name="adresse" defaultValue={zone?.adresse || ''} />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="position">Position</label>
            <Input id="position" name="position" type="number" defaultValue={zone?.position || 0} />
          </div>
          <div className="flex items-center gap-2">
            <input id="actif" name="actif" type="checkbox" defaultChecked={zone?.actif ?? true} />
            <label htmlFor="actif">Zone active</label>
          </div>
          <p className="text-xs text-muted-foreground">La réquisition est possible uniquement pour les zones de type cave ou shop.</p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/parametrage/zones')}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

