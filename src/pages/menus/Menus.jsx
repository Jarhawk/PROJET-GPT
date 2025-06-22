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
  const { menus, getMenus, deleteMenu } = useMenus();
  const { fiches, fetchFiches } = useFiches();
  const { mama_id, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [weekFilter, setWeekFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [page, setPage] = useState(1);

  const getWeek = (dateStr) => {
    const d = new Date(dateStr);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  };

  // Récupération initiale des menus et fiches
  useEffect(() => {
    if (!authLoading && mama_id) {
      getMenus();
      fetchFiches();
    }
  }, [authLoading, mama_id, getMenus, fetchFiches]);

  const menusFiltres = menus.filter(m => {
    if (search && !m.nom?.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFilter && m.date !== dateFilter) return false;
    if (weekFilter && getWeek(m.date) !== weekFilter) return false;
    if (monthFilter && m.date.slice(0, 7) !== monthFilter) return false;
    return true;
  });
  const perPage = 10;
  const pageCount = Math.ceil(menusFiltres.length / perPage);
  const paginatedMenus = menusFiltres.slice((page - 1) * perPage, page * perPage);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(menus.map(m => ({
      ...m,
      fiches: m.fiches?.map(f => f.fiche?.nom).join(", ")
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Menus");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "menus.xlsx");
  };

  const handleDelete = async (menu) => {
    if (window.confirm(`Supprimer le menu "${menu.nom}" ?`)) {
      await deleteMenu(menu.id);
      await getMenus();
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
        <input
          type="week"
          value={weekFilter}
          onChange={e => setWeekFilter(e.target.value)}
          className="input"
        />
        <input
          type="month"
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
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
            <th className="px-4 py-2"># Fiches</th>
            <th className="px-4 py-2">Coût total</th>
            <th className="px-4 py-2">Actif</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedMenus.map(menu => (
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
              <td className="border px-4 py-2 text-center">{menu.fiches?.length || 0}</td>
              <td className="border px-4 py-2">{
                (menu.fiches || []).reduce((sum, f) => {
                  const fiche = fiches.find(fi => fi.id === f.fiche_id || fi.id === f.fiche?.id);
                  return sum + (Number(fiche?.cout_total) || 0);
                }, 0).toFixed(2)
              } €</td>
              <td className="border px-4 py-2 text-center">{menu.actif ? "✔" : "✖"}</td>
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
                  onClick={() => { setSelected({ ...menu, date: "" }); setShowForm(true); }}
                >
                  Dupliquer
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
      <div className="flex justify-center gap-2 my-4">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Précédent
        </Button>
        <span className="px-2">Page {page} / {pageCount}</span>
        <Button
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => setPage(p => Math.min(pageCount, p + 1))}
        >
          Suivant
        </Button>
      </div>
      {showForm && (
        <MenuForm
          menu={selected}
          fiches={fiches}
          onClose={() => { setShowForm(false); setSelected(null); getMenus(); }}
        />
      )}
      {showDetail && selected && (
        <MenuDetail
          menu={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
          onDuplicate={m => { setSelected({ ...m, date: "" }); setShowForm(true); }}
        />
      )}
    </div>
  );
}
