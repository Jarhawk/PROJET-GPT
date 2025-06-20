import { useEffect, useState } from "react";
import { useMenus } from "@/hooks/useMenus";
import { useFiches } from "@/hooks/useFiches";
import { useAuth } from "@/context/AuthContext";
import MenuForm from "./MenuForm.jsx";
import MenuDetail from "./MenuDetail.jsx";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion as Motion } from "framer-motion";

export default function Menus() {
  const { menus, fetchMenus, deleteMenu } = useMenus();
  const { fiches, fetchFiches } = useFiches();
  const { mama_id, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Récupération initiale des menus et fiches
  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchMenus();
      fetchFiches();
    }
  }, [authLoading, mama_id, fetchMenus, fetchFiches]);

  const menusFiltres = menus.filter(m =>
    (!search || m.nom?.toLowerCase().includes(search.toLowerCase())) &&
    (!dateFilter || m.date === dateFilter)
  );

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(menus.map(m => ({
      ...m,
      fiches: m.fiches?.map(f => f.nom).join(", ")
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Menus");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "menus.xlsx");
  };

  const handleDelete = async (menu) => {
    if (window.confirm(`Supprimer le menu "${menu.nom}" ?`)) {
      await deleteMenu(menu.id);
      await fetchMenus();
      toast.success("Menu supprimé.");
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
          placeholder="Recherche menu"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="input"
        />
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter un menu
        </Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
      <Motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-full bg-white rounded-xl shadow-md"
      >
        <thead>
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Fiches</th>
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
      </Motion.table>
      {showForm && (
        <MenuForm
          menu={selected}
          fiches={fiches}
          onClose={() => { setShowForm(false); setSelected(null); fetchMenus(); }}
        />
      )}
      {showDetail && selected && (
        <MenuDetail
          menu={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
