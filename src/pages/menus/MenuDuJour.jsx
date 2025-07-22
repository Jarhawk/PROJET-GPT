// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useMenuDuJour } from "@/hooks/useMenuDuJour";
import { useFiches } from "@/hooks/useFiches";
import useAuth from "@/hooks/useAuth";
import MenuDuJourForm from "./MenuDuJourForm.jsx";
import MenuDuJourDetail from "./MenuDuJourDetail.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster, toast } from "react-hot-toast";
import { motion as Motion } from "framer-motion";

export default function MenuDuJour() {
  const { menusDuJour, fetchMenusDuJour, deleteMenuDuJour, exportMenusDuJourToExcel } = useMenuDuJour();
  const { fiches, fetchFiches } = useFiches();
  const { mama_id, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchMenusDuJour({ search, date: dateFilter || undefined });
      fetchFiches();
    }
  }, [authLoading, mama_id, search, dateFilter, fetchMenusDuJour, fetchFiches]);

  const menusFiltres = menusDuJour.filter(m =>
    (!search || m.nom?.toLowerCase().includes(search.toLowerCase())) &&
    (!dateFilter || m.date === dateFilter)
  );

  const exportExcel = () => {
    exportMenusDuJourToExcel();
  };

  const handleDelete = async (menu) => {
    if (window.confirm(`Supprimer le menu du jour "${menu.nom}" ?`)) {
      await deleteMenuDuJour(menu.id);
      fetchMenusDuJour({ search, date: dateFilter || undefined });
      toast.success("Menu du jour supprimé.");
    }
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          placeholder="Recherche menu du jour"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="input"
        />
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter un menu du jour
        </Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
      <TableContainer as={Motion.table} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
        <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Fiches</th>
            <th className="px-4 py-2">Coût</th>
            <th className="px-4 py-2">Marge</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {menusFiltres.map(menu => (
            <tr key={menu.id}>
              <td className="border px-4 py-2">{menu.date}</td>
              <td className="border px-4 py-2">
                <Button
                  variant="link"
                  className="font-semibold text-mamastockGold"
                  onClick={() => { setSelected(menu); setShowDetail(true); }}
                >
                  {menu.nom}
                </Button>
              </td>
              <td className="border px-4 py-2">
                {menu.fiches?.map(f => f.nom).join(", ")}
              </td>
              <td className="border px-4 py-2">{menu.cout_total?.toFixed(2)} €</td>
              <td className="border px-4 py-2">{menu.marge != null ? `${menu.marge.toFixed(1)}%` : '-'}</td>
              <td className="border px-4 py-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={() => { setSelected(menu); setShowForm(true); }}
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={() => handleDelete(menu)}
                >
                  Supprimer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </TableContainer>
      {showForm && (
        <MenuDuJourForm
          menu={selected}
          fiches={fiches}
          onClose={() => { setShowForm(false); setSelected(null); fetchMenusDuJour({ search, date: dateFilter || undefined }); }}
        />
      )}
      {showDetail && selected && (
        <MenuDuJourDetail
          menu={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
