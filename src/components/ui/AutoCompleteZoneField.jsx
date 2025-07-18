// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from 'react';
import AutoCompleteField from './AutoCompleteField';
import { useZones } from '@/hooks/useZones';

export default function AutoCompleteZoneField({ value, onChange, ...props }) {
  const { zones, fetchZones } = useZones();
  useEffect(() => { fetchZones(); }, [fetchZones]);
  const options = zones.filter(z => z.actif).map(z => z.nom);
  return (
    <AutoCompleteField
      {...props}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
