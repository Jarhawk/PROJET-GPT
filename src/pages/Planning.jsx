// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePlanning } from "@/hooks/usePlanning";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Planning() {
  const { getPlannings } = usePlanning();
  const [items, setItems] = useState([]);
  const [statut, setStatut] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await getPlannings({ statut, debut, fin });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statut, debut, fin]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-end gap-4">
        <div className="flex gap-2">
          <select className="input" value={statut} onChange={e => setStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="prévu">Prévu</option>
            <option value="confirmé">Confirmé</option>
          </select>
          <input type="date" className="input" value={debut} onChange={e => setDebut(e.target.value)} />
          <input type="date" className="input" value={fin} onChange={e => setFin(e.target.value)} />
        </div>
        <Link to="/planning/nouveau"><Button>Nouvelle entrée</Button></Link>
      </div>
      {loading ? (
        <LoadingSpinner message="Chargement..." />
      ) : (
        <TableContainer>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">Nom</th>
                <th className="px-2 py-1 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="px-2 py-1 whitespace-nowrap">
                    <Link to={`/planning/${p.id}`} className="text-mamastockGold hover:underline">
                      {p.date_prevue}
                    </Link>
                  </td>
                  <td className="px-2 py-1">{p.nom}</td>
                  <td className="px-2 py-1">{p.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
