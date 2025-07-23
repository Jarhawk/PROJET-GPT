// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { usePromotions } from "@/hooks/usePromotions";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import PromotionRow from "@/components/promotions/PromotionRow";
import { Toaster, toast } from "react-hot-toast";
import PromotionForm from "./PromotionForm.jsx";

export default function Promotions() {
  const {
    promotions,
    total,
    fetchPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
  } = usePromotions();
  const { mama_id, loading: authLoading, access_rights, hasAccess } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [search, setSearch] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [saving, setSaving] = useState(false);
  const canEdit = hasAccess("promotions", "peut_modifier");

  const refreshList = useCallback(() => {
    fetchPromotions({
      search,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      page,
      limit: PAGE_SIZE,
    });
  }, [fetchPromotions, search, actifFilter, page]);

  useEffect(() => {
    if (!authLoading && mama_id) {
      refreshList();
    }
  }, [authLoading, mama_id, refreshList]);

  if (authLoading) return null;
  if (!mama_id) return null;
  if (!access_rights?.promotions?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  const filtered = promotions.filter((p) => {
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (
      actifFilter !== "all" &&
      (actifFilter === "true" ? !p.actif : p.actif)
    )
      return false;
    return true;
  });

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette promotion ?")) {
      await deletePromotion(id);
      toast.success("Promotion supprimée");
      refreshList();
    }
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <div className="flex gap-4 mb-4 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="input"
          placeholder="Recherche promotion"
        />
        <select
          className="input"
          value={actifFilter}
          onChange={(e) => {
            setPage(1);
            setActifFilter(e.target.value);
          }}
        >
          <option value="all">Toutes</option>
          <option value="true">Actives</option>
          <option value="false">Inactives</option>
        </select>
        {canEdit && (
          <Button onClick={() => setShowForm(true)}>Nouvelle promotion</Button>
        )}
      </div>
      <TableContainer className="mt-2">
        <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Début</th>
            <th className="px-4 py-2">Fin</th>
            <th className="px-4 py-2">Active</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <PromotionRow
              key={p.id}
              promotion={p}
              canEdit={canEdit}
              onEdit={() => {
                setEditRow(p);
                setShowForm(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
        </table>
        <div className="mt-4 flex gap-2 justify-center">
          {Array.from(
            { length: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
            (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={page === i + 1 ? "default" : "outline"}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ),
          )}
        </div>
      </TableContainer>
      {showForm && (
        <PromotionForm
          promotion={editRow}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditRow(null);
            refreshList();
          }}
          onSave={async (values) => {
            try {
              setSaving(true);
              if (editRow) {
                await updatePromotion(editRow.id, values);
                toast.success("Promotion modifiée !");
              } else {
                await addPromotion(values);
                toast.success("Promotion ajoutée !");
              }
              setShowForm(false);
              setEditRow(null);
              refreshList();
            } catch (err) {
              console.error("Erreur enregistrement promotion:", err);
              toast.error("Erreur lors de l'enregistrement.");
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}
