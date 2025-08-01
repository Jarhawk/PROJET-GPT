import { useEffect } from 'react';
import AutoCompleteField from './AutoCompleteField';
import { useFamilles } from '@/hooks/useFamilles';
import { toast } from 'react-hot-toast';

export default function AutoCompleteFamilleField({ value, onChange, ...props }) {
  const { familles, fetchFamilles, addFamille } = useFamilles();
  useEffect(() => { fetchFamilles(); }, [fetchFamilles]);
  const options = familles.map(f => ({ id: f.id, nom: f.nom })).sort((a,b)=>a.nom.localeCompare(b.nom));
  const handleAdd = async (val) => {
    const { data, error } = await addFamille(val);
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
