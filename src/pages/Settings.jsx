import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { getConfig, saveConfig, defaultDataDir } from '@/lib/config';
import { backupDb, restoreDb, maintenanceDb } from '@/lib/fsHelpers';
import { toast } from 'sonner';

export default function Settings() {
  const [dataDir, setDataDir] = useState(defaultDataDir);
  useEffect(() => {
    const cfg = getConfig();
    if (cfg?.dataDir) setDataDir(cfg.dataDir);
  }, []);
  const chooseDir = () => {
    const val = window.prompt('Dossier data', dataDir);
    if (val) setDataDir(val);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    saveConfig({ dataDir });
  };
  const handleBackup = async () => {
    try {
      await backupDb();
      toast.success('Sauvegarde effectuée');
    } catch (e) {
      toast.error('Échec sauvegarde');
    }
  };
  const handleRestore = async () => {
    try {
      const ok = await restoreDb();
      if (ok) {
        toast.success('Base restaurée, redémarrage…');
        window.location.reload();
      }
    } catch (e) {
      toast.error('Échec restauration');
    }
  };
  const handleMaintenance = async () => {
    try {
      await maintenanceDb();
      toast.success('Maintenance terminée');
    } catch (e) {
      toast.error('Échec maintenance');
    }
  };
  return (
    <div className="p-6 container mx-auto">
      <GlassCard title="Paramètres">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Dossier data</label>
            <div className="flex gap-2">
              <input
                className="input w-full"
                value={dataDir}
                onChange={(e) => setDataDir(e.target.value)}
              />
              <button type="button" className="btn" onClick={chooseDir}>
                Choisir…
              </button>
            </div>
          </div>
          <PrimaryButton type="submit">Enregistrer</PrimaryButton>
        </form>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn" onClick={handleBackup}>Sauvegarder</button>
          <button type="button" className="btn" onClick={handleRestore}>Restaurer</button>
          <button type="button" className="btn" onClick={handleMaintenance}>Maintenance</button>
        </div>
      </GlassCard>
    </div>
  );
}
