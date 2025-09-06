import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { getConfig, saveConfig, defaultDataDir } from '@/lib/config';

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
      </GlassCard>
    </div>
  );
}
