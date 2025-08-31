// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from 'react';
import AutoCompleteField from './AutoCompleteField';
import { useZones } from '@/hooks/useZones';

export default function AutoCompleteZoneField({ value, onChange, ...props }) {
  const { zones, fetchZones } = useZones();
  useEffect(() => { fetchZones(); }, [fetchZones]);
  const options = (() => {
    const arr = Array.isArray(zones) ? zones : [];
    const res = [];
    for (const z of arr) {
      if (z.actif) res.push({ id: z.id, nom: z.nom });
    }
    return res;
  })();
  return (
    <AutoCompleteField
      {...props}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
