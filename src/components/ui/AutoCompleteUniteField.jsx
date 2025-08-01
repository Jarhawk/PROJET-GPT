import { useEffect } from 'react';
import AutoCompleteField from './AutoCompleteField';
import { useUnites } from '@/hooks/useUnites';
import { toast } from 'react-hot-toast';

export default function AutoCompleteUniteField({ value, onChange, ...props }) {
  const { unites, fetchUnites, addUnite } = useUnites();
  useEffect(() => { fetchUnites(); }, [fetchUnites]);
  const options = unites.map(u => ({ id: u.id, nom: u.nom })).sort((a,b)=>a.nom.localeCompare(b.nom));
  const handleAdd = async (val) => {
    const { data, error } = await addUnite(val);
    if (error) toast.error(error.message || error);
    else return { id: data.id, nom: data.nom };
  };
  return (
    <AutoCompleteField
      {...props}
      value={value}
      onChange={onChange}
      options={options}
      onAddNewValue={handleAdd}
    />
  );
}
