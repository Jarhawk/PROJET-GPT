// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useMenus } from '@/hooks/useMenus';
import { useFiches } from '@/hooks/useFiches';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import MenuForm from './MenuForm.jsx';
import MenuDetail from './MenuDetail.jsx';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { motion as Motion } from 'framer-motion';
import ListingContainer from '@/components/ui/ListingContainer';
import PaginationFooter from '@/components/ui/PaginationFooter';
import TableHeader from '@/components/ui/TableHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Menus() {
  const { menus, total, getMenus, deleteMenu, loading } = useMenus();
  const { fiches, fetchFiches } = useFiches();
  const { mama_id, loading: authLoading, access_rights } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [page, setPage] = useState(1);

  const perPage = 10;

  const loadMenus = () => {
    const opts = {
      search,
      date: dateFilter || undefined,
      offset: (page - 1) * perPage,
      limit: perPage,
    };
    if (weekFilter) {
      const [year, wk] = weekFilter.split('-W');
      const first = new Date(year, 0, 1 + (wk - 1) * 7);
      const start = new Date(
        first.setDate(first.getDate() - first.getDay() + 1)
      );
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      opts.start = start.toISOString().slice(0, 10);
      opts.end = end.toISOString().slice(0, 10);
    }
    if (monthFilter) {
      const [y, m] = monthFilter.split('-');
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      opts.start = start.toISOString().slice(0, 10);
      opts.end = end.toISOString().slice(0, 10);
    }
    getMenus(opts);
    fetchFiches();
  };

  // Chargement initial et à chaque filtre
  useEffect(() => {
    if (!authLoading && mama_id) {
      loadMenus();
    }
  }, [
    authLoading,
    mama_id,
    search,
    dateFilter,
    weekFilter,
    monthFilter,
    page,
    getMenus,
    fetchFiches,
  ]);

  const pageCount = Math.ceil(total / perPage);
  const paginatedMenus = Array.isArray(menus) ? menus : [];
  const ficheList = Array.isArray(fiches) ? fiches : [];

  if (authLoading || loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!access_rights?.menus?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const list = Array.isArray(menus) ? menus : [];
    const rows = [];
    for (let i = 0; i < list.length; i += 1) {
      const m = list[i];
      const names = [];
      if (Array.isArray(m.fiches)) {
        for (let j = 0; j < m.fiches.length; j += 1) {
          const f = m.fiches[j];
          if (f?.fiche?.nom) names.push(f.fiche.nom);
        }
      }
      rows.push({ ...m, fiches: names.join(', ') });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Menus');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'menus.xlsx');
  };

  const handleDelete = async (menu) => {
    if (window.confirm(`Supprimer le menu "${menu.nom}" ?`)) {
      await deleteMenu(menu.id);
      loadMenus();
      toast.success('Menu supprimé.');
    }
  };

  return (
    <div className="p-6 container mx-auto">
            <TableHeader>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          placeholder="Recherche menu"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="form-input"
        />
        <input
          type="week"
          value={weekFilter}
          onChange={(e) => setWeekFilter(e.target.value)}
          className="form-input"
        />
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="form-input"
        />
        <Button
          onClick={() => {
            setSelected(null);
            setShowForm(true);
          }}
        >
          Ajouter un menu
        </Button>
        <Button variant="outline" onClick={exportExcel}>
          Export Excel
        </Button>
      </TableHeader>
      <ListingContainer className="mt-4">
        <Motion.table
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-full text-sm"
        >
          <thead>
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2 text-right"># Fiches</th>
              <th className="px-4 py-2 text-right">Coût total</th>
              <th className="px-4 py-2">Actif</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = [];
              for (let i = 0; i < paginatedMenus.length; i += 1) {
                const menu = paginatedMenus[i];
                const ficheArray = Array.isArray(menu.fiches) ? menu.fiches : [];
                let totalFiche = 0;
                for (let j = 0; j < ficheArray.length; j += 1) {
                  const f = ficheArray[j];
                  let fiche = null;
                  for (let k = 0; k < ficheList.length; k += 1) {
                    const fi = ficheList[k];
                    if (fi.id === f.fiche_id || fi.id === f.fiche?.id) {
                      fiche = fi;
                      break;
                    }
                  }
                  totalFiche += Number(fiche?.cout_total) || 0;
                }
                rows.push(
                  <tr key={menu.id}>
                    <td className="border px-4 py-2">{menu.date}</td>
                    <td className="border px-4 py-2">
                      <Button
                        variant="link"
                        className="font-semibold text-mamastockGold"
                        onClick={() => {
                          setSelected(menu);
                          setShowDetail(true);
                        }}
                      >
                        {menu.nom}
                      </Button>
                    </td>
                    <td className="border px-4 py-2 text-right">{ficheArray.length}</td>
                    <td className="border px-4 py-2 text-right">
                      {totalFiche.toFixed(2)} €
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {menu.actif ? '✔' : '✖'}
                    </td>
                    <td className="border px-4 py-2">
                      {access_rights?.menus?.peut_modifier && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mr-2"
                            onClick={() => {
                              setSelected(menu);
                              setShowForm(true);
                            }}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mr-2"
                            onClick={() => {
                              setSelected({ ...menu, date: '' });
                              setShowForm(true);
                            }}
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
                        </>
                      )}
                    </td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </Motion.table>
      </ListingContainer>
      <PaginationFooter
        page={page}
        pages={pageCount}
        onPageChange={setPage}
        className="my-4"
      />
      {showForm && (
        <MenuForm
          menu={selected}
          fiches={fiches}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            loadMenus();
          }}
        />
      )}
      {showDetail && selected && (
        <MenuDetail
          menu={selected}
          onClose={() => {
            setShowDetail(false);
            setSelected(null);
          }}
          onDuplicate={(m) => {
            setSelected({ ...m, date: '' });
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}
