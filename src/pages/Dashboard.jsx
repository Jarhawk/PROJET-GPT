// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite.
import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useGadgets } from '@/hooks/useGadgets';
import GadgetConfigForm from '@/components/dashboard/GadgetConfigForm';
import WidgetRenderer from '@/components/dashboard/WidgetRenderer';

export default function Dashboard() {
  const { loading: authLoading } = useAuth();
  const { gadgets, loading, fetchGadgets, saveGadgets } = useGadgets();
  const [ordered, setOrdered] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchGadgets();
  }, [fetchGadgets]);

  useEffect(() => {
    setOrdered(gadgets);
  }, [gadgets]);

  if (authLoading || loading) return <LoadingSpinner message="Chargement..." />;

  const saveOrder = async () => {
    await saveGadgets(ordered);
  };

  return (
    <div className="p-6 space-y-4">
      {showForm && (
        <GlassCard className="p-4 max-w-lg mx-auto">
          <GadgetConfigForm onSave={() => { setShowForm(false); fetchGadgets(); }} onCancel={() => setShowForm(false)} />
        </GlassCard>
      )}
      <Reorder.Group axis="y" values={ordered} onReorder={setOrdered} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ordered.map((g, idx) => (
          <Reorder.Item key={idx} value={g} className="bg-glass border border-borderGlass rounded-xl p-4">
            <WidgetRenderer config={g.configuration_json} />
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <div className="flex gap-2">
        <Button onClick={() => setShowForm(true)}>Ajouter un gadget</Button>
        <Button onClick={saveOrder}>Enregistrer</Button>
      </div>
    </div>
  );
}
