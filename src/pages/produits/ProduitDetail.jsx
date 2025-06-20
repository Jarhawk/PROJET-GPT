import { useParams } from 'react-router-dom';

export default function ProduitDetail() {
  const { id } = useParams();
  return <div>Page Produit Detail {id} (en construction)</div>;
}
