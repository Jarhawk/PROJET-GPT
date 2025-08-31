// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useMenuDuJour } from "@/hooks/useMenuDuJour";
import { useFiches } from "@/hooks/useFiches";
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import MenuDuJourForm from "./MenuDuJourForm.jsx";
import MenuDuJourDetail from "./MenuDuJourDetail.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { toast } from 'sonner';
import { motion as Motion } from "framer-motion";

export default function MenuDuJour() {
  const { menusDuJour, fetchMenusDuJour, deleteMenuDuJour, exportMenusDuJourToExcel } = useMenuDuJour();
  const { fiches, fetchFiches } = useFiches();
  const { mama_id, loading: authLoading, access_rights } = useAuth();
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

  const list = Array.isArray(menusDuJour) ? menusDuJour : [];
  const menusFiltres = [];
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    if (
      (!search || m.nom?.toLowerCase().includes(search.toLowerCase())) &&
      (!dateFilter || m.date === dateFilter)
    ) {
      menusFiltres.push(m);
    }
  }

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

  if (!access_rights?.menus_jour?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="p-6 container mx-auto">
            <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input"
          placeholder="Recherche menu du jour"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="form-input"
        />
        {access_rights?.menus_jour?.peut_modifier && (
          <Button onClick={() => { setSelected(null); setShowForm(true); }}>
            Ajouter un menu du jour
          </Button>
        )}
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
          {(() => {
            const rows = [];
            for (let i = 0; i < menusFiltres.length; i++) {
              const menu = menusFiltres[i];
              const fichesList = Array.isArray(menu.fiches) ? menu.fiches : [];
              const noms = [];
              for (let j = 0; j < fichesList.length; j++) {
                const f = fichesList[j];
                noms.push(f.nom);
              }
              rows.push(
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
                  <td className="border px-4 py-2">{noms.join(", ")}</td>
                  <td className="border px-4 py-2">{menu.cout_total?.toFixed(2)} €</td>
                  <td className="border px-4 py-2">{menu.marge != null ? `${menu.marge.toFixed(1)}%` : '-'}</td>
                  <td className="border px-4 py-2">
                    {access_rights?.menus_jour?.peut_modifier && (
                      <>
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
                      </>
                    )}
                  </td>
                </tr>
              );
            }
            return rows;
          })()}
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
