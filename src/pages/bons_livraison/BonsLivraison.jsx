// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useBonsLivraison } from "@/hooks/useBonsLivraison";
import useFournisseurs from "@/hooks/data/useFournisseurs";
import BLForm from "./BLForm.jsx";
import BLDetail from "./BLDetail.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import BonLivraisonRow from "@/components/bons_livraison/BonLivraisonRow";
import { useAuth } from '@/hooks/useAuth';

export default function BonsLivraison() {
  const { bons, total, getBonsLivraison, toggleBonActif } = useBonsLivraison();
  const { data: fournisseurs = [] } = useFournisseurs({ actif: true });
  const { hasAccess } = useAuth();
  const canEdit = hasAccess("bons_livraison", "peut_modifier");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("true");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;


  const refreshList = useCallback(() => {
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
  }, [getBonsLivraison, fournisseurFilter, monthFilter, actifFilter, page]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const bonsList = Array.isArray(bons) ? bons : [];
  const fournisseurList = Array.isArray(fournisseurs) ? fournisseurs : [];

  const rows = [];
  for (let i = 0; i < bonsList.length; i++) {
    const b = bonsList[i];
    const lines = Array.isArray(b.lignes) ? b.lignes : [];
    let montant = 0;
    for (let j = 0; j < lines.length; j++) {
      const l = lines[j];
      const q = l.quantite_recue || 0;
      const pu = l.prix_unitaire || 0;
      const tva = l.tva || 0;
      montant += q * pu * (1 + tva / 100);
    }
    rows.push({ ...b, lignes_count: lines.length, montant });
  }

  const fournisseurOptions = [];
  for (let i = 0; i < fournisseurList.length; i++) {
    const f = fournisseurList[i];
    fournisseurOptions.push(
      <option key={f.id} value={f.id}>
        {f.nom}
      </option>
    );
  }

  const rowComponents = [];
  for (let i = 0; i < rows.length; i++) {
    const bl = rows[i];
    rowComponents.push(
      <BonLivraisonRow
        key={bl.id}
        bon={bl}
        canEdit={canEdit}
        onEdit={(b) => {
          setSelected(b);
          setShowForm(true);
        }}
        onDetail={(b) => {
          setSelected(b);
          setShowDetail(true);
        }}
        onToggleActive={async (id, actif) => {
          await toggleBonActif(id, actif);
          refreshList();
        }}
      />
    );
  }

  return (
    <div className="p-6 container mx-auto text-shadow space-y-4">
            <GlassCard className="flex flex-wrap gap-2 items-end">
        <select className="form-input" value={fournisseurFilter} onChange={e => { setFournisseurFilter(e.target.value); setPage(1); }}>
          <option value="">Tous fournisseurs</option>
          {fournisseurOptions}
        </select>
        <input type="month" className="form-input" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1); }} />
        <select className="form-input" value={actifFilter} onChange={e => { setActifFilter(e.target.value); setPage(1); }}>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
          <option value="all">Tous</option>
        </select>
        {canEdit && (
          <Button onClick={() => { setSelected(null); setShowForm(true); }}>
            Créer BL
          </Button>
        )}
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
          <tbody>{rowComponents}</tbody>
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
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            refreshList();
          }}
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
