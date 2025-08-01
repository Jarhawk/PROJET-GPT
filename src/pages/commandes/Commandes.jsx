// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useCommandes } from "@/hooks/useCommandes";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import CommandeForm from "./CommandeForm.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster } from "react-hot-toast";

export default function Commandes() {
  const { commandes, total, getCommandes, toggleCommandeActif } = useCommandes();
  const { fournisseurs, getFournisseurs } = useFournisseurs();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => { getFournisseurs(); }, [getFournisseurs]);

  useEffect(() => {
    getCommandes({ fournisseur: fournisseurFilter, statut: statutFilter, page, pageSize: PAGE_SIZE });
  }, [fournisseurFilter, statutFilter, page]);

  const rows = commandes.map(c => ({ ...c, lignes_count: c.lignes?.length || 0 }));

  return (
    <div className="p-6 container mx-auto text-shadow space-y-4">
      <Toaster />
      <GlassCard className="flex flex-wrap gap-2 items-end">
        <select className="form-input" value={fournisseurFilter} onChange={e => { setFournisseurFilter(e.target.value); setPage(1); }}>
          <option value="">Tous fournisseurs</option>
          {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
        <select className="form-input" value={statutFilter} onChange={e => { setStatutFilter(e.target.value); setPage(1); }}>
          <option value="">Tous statuts</option>
          <option value="a_valider">À valider</option>
          <option value="envoyee">Envoyée</option>
          <option value="receptionnee">Réceptionnée</option>
          <option value="cloturee">Clôturée</option>
        </select>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>Créer commande</Button>
      </GlassCard>
      <TableContainer>
        <table className="min-w-full text-sm text-white">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Fournisseur</th>
              <th className="px-2 py-1">Statut</th>
              <th className="px-2 py-1">Lignes</th>
              <th className="px-2 py-1">Actif</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.id}>
                <td className="border px-2 py-1">{c.date_commande}</td>
                <td className="border px-2 py-1">{c.fournisseur?.nom}</td>
                <td className="border px-2 py-1">{c.statut}</td>
                <td className="border px-2 py-1 text-right">{c.lignes_count}</td>
                <td className="border px-2 py-1">{c.actif ? "✅" : "❌"}</td>
                <td className="border px-2 py-1 space-x-1">
                  <Button size="sm" variant="outline" onClick={() => { setSelected(c); setShowForm(true); }}>Éditer</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleCommandeActif(c.id, !c.actif)}>{c.actif ? "Désactiver" : "Réactiver"}</Button>
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
        <CommandeForm
          commande={selected}
          fournisseurs={fournisseurs}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            getCommandes({ fournisseur: fournisseurFilter, statut: statutFilter, page, pageSize: PAGE_SIZE });
          }}
        />
      )}
    </div>
  );
}
