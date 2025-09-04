import useFournisseurs from '@/hooks/data/useFournisseurs';

export function useFournisseursList(params = {}) {
  const query = useFournisseurs(params);
  const list = Array.isArray(query.data?.data) ? query.data.data : [];
  const count = query.data?.count ?? 0;
  return { ...query, data: list, count };
}

export default useFournisseursList;
