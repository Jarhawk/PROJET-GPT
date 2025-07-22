// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useAchats } from "@/hooks/useAchats";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import AchatForm from "./AchatForm.jsx";
import AchatDetail from "./AchatDetail.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster } from "react-hot-toast";

export default function Achats() {
  const { achats, total, getAchats, deleteAchat } = useAchats();
  const { suppliers } = useSuppliers();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const [produit, setProduit] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actifFilter, setActifFilter] = useState("true");
  const PAGE_SIZE = 20;

  useEffect(() => { searchProduits(""); }, [searchProduits]);

  useEffect(() => {
    const debut = month ? `${month}-01` : "";
    const fin = month ? `${month}-31` : "";
    getAchats({
      produit,
      fournisseur,
      debut,
      fin,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      page,
      pageSize: PAGE_SIZE,
    });
  }, [produit, fournisseur, month, actifFilter, page]);

  return (
    <div className="p-6 container mx-auto text-shadow space-y-4">
      <Toaster />
      <GlassCard className="flex flex-wrap gap-2 items-end">
        <select className="input" value={fournisseur} onChange={e => { setFournisseur(e.target.value); setPage(1); }}>
          <option value="">Tous fournisseurs</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <input
          list="produits-list"
          className="input"
          value={produit}
          onChange={e => { setProduit(e.target.value); setPage(1); if (e.target.value.length >= 2) searchProduits(e.target.value); }}
          placeholder="Produit"
        />
        <datalist id="produits-list">{produitOptions.map(p => <option key={p.id} value={p.nom} />)}</datalist>
        <input
          type="month"
          className="input"
          value={month}
          onChange={e => {
            setMonth(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          value={actifFilter}
          onChange={e => {
            setActifFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
          <option value="all">Tous</option>
        </select>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>Ajouter</Button>
      </GlassCard>
      <TableContainer>
        <table className="min-w-full text-sm text-white">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1">Fournisseur</th>
              <th className="px-2 py-1">Qté</th>
              <th className="px-2 py-1">Prix</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {achats.map(a => (
              <tr key={a.id}>
                <td className="border px-2 py-1">{a.date_achat}</td>
                <td className="border px-2 py-1">{a.produit?.nom}</td>
                <td className="border px-2 py-1">{a.fournisseur?.nom}</td>
                <td className="border px-2 py-1 text-right">{a.quantite}</td>
                <td className="border px-2 py-1 text-right">{Number(a.prix || 0).toFixed(2)} €</td>
                <td className="border px-2 py-1 space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(a);
                      setShowForm(true);
                    }}
                  >
                    Éditer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(a);
                      setShowDetail(true);
                    }}
                  >
                    Détail
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await deleteAchat(a.id);
                      const debut = month ? `${month}-01` : "";
                      const fin = month ? `${month}-31` : "";
                      getAchats({
                        produit,
                        fournisseur,
                        debut,
                        fin,
                        actif: actifFilter === "all" ? null : actifFilter === "true",
                        page,
                        pageSize: PAGE_SIZE,
                      });
                    }}
                  >
                    Archiver
                  </Button>
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
        <AchatForm
          achat={selected}
          suppliers={suppliers}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            const debut = month ? `${month}-01` : "";
            const fin = month ? `${month}-31` : "";
            getAchats({
              produit,
              fournisseur,
              debut,
              fin,
              actif: actifFilter === "all" ? null : actifFilter === "true",
              page,
              pageSize: PAGE_SIZE,
            });
          }}
        />
      )}
      {showDetail && selected && (
        <AchatDetail
          achat={selected}
          onClose={() => {
            setShowDetail(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
