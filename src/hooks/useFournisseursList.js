import useFournisseurs from '@/hooks/data/useFournisseurs';

export function useFournisseursList(params = {}) {
  const query = useFournisseurs(params);
  const list = Array.isArray(query.data) ? query.data : [];
  const count = list.length;
  return { ...query, data: list, count };
}

export default useFournisseursList;
