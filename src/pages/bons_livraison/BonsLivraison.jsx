// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useBonsLivraison } from "@/hooks/useBonsLivraison";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import BLForm from "./BLForm.jsx";
import BLDetail from "./BLDetail.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster } from "react-hot-toast";

export default function BonsLivraison() {
  const { bons, total, getBonsLivraison, toggleBonActif } = useBonsLivraison();
  const { fournisseurs, getFournisseurs } = useFournisseurs();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("true");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => { getFournisseurs(); }, [getFournisseurs]);

  useEffect(() => {
    const debut = monthFilter ? `${monthFilter}-01` : "";
    const fin = monthFilter ? `${monthFilter}-31` : "";
    getBonsLivraison({
      fournisseur: fournisseurFilter,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      debut,
      fin,
      page,
      pageSize: PAGE_SIZE,
    });
  }, [fournisseurFilter, monthFilter, actifFilter, page]);

  const rows = bons.map(b => ({
    ...b,
    lignes_count: b.lignes?.length || 0,
    montant: (b.lignes || []).reduce((s,l) => s + (l.quantite_recue || 0) * (l.prix_unitaire || 0) * (1 + (l.tva || 0)/100), 0),
  }));

  return (
    <div className="p-6 container mx-auto text-shadow space-y-4">
      <Toaster />
      <GlassCard className="flex flex-wrap gap-2 items-end">
        <select className="input" value={fournisseurFilter} onChange={e => { setFournisseurFilter(e.target.value); setPage(1); }}>
          <option value="">Tous fournisseurs</option>
          {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
        <input type="month" className="input" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1); }} />
        <select className="input" value={actifFilter} onChange={e => { setActifFilter(e.target.value); setPage(1); }}>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
          <option value="all">Tous</option>
        </select>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>Créer BL</Button>
      </GlassCard>
      <TableContainer>
        <table className="min-w-full text-sm text-white">
          <thead>
            <tr>
              <th className="px-2 py-1">Numéro</th>
              <th className="px-2 py-1">Fournisseur</th>
              <th className="px-2 py-1">Réception</th>
              <th className="px-2 py-1">Lignes</th>
              <th className="px-2 py-1">Montant</th>
              <th className="px-2 py-1">Actif</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(bl => (
              <tr key={bl.id}>
                <td className="border px-2 py-1">{bl.numero_bl}</td>
                <td className="border px-2 py-1">{bl.fournisseur?.nom}</td>
                <td className="border px-2 py-1">{bl.date_reception}</td>
                <td className="border px-2 py-1 text-right">{bl.lignes_count}</td>
                <td className="border px-2 py-1 text-right">{bl.montant.toFixed(2)} €</td>
                <td className="border px-2 py-1">{bl.actif ? "✅" : "❌"}</td>
                <td className="border px-2 py-1 space-x-1">
                  <Button size="sm" variant="outline" onClick={() => { setSelected(bl); setShowForm(true); }}>Éditer</Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelected(bl); setShowDetail(true); }}>Détail</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleBonActif(bl.id, !bl.actif)}>{bl.actif ? "Désactiver" : "Réactiver"}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      <div className="flex justify-between items-center">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</Button>
        <span>Page {page}</span>
        <Button variant="outline" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Suivant</Button>
      </div>
      {showForm && (
        <BLForm
          bon={selected}
          fournisseurs={fournisseurs}
          onClose={() => { setShowForm(false); setSelected(null); getBonsLivraison({ fournisseur: fournisseurFilter, actif: actifFilter === "all" ? null : actifFilter === "true", debut: monthFilter ? `${monthFilter}-01` : "", fin: monthFilter ? `${monthFilter}-31` : "", page, pageSize: PAGE_SIZE }); }}
        />
      )}
      {showDetail && selected && (
        <BLDetail
          bon={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
