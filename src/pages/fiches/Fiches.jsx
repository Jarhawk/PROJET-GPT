import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { AnimatePresence, motion as _motion } from "framer-motion";
import FicheForm from "@/components/fiches/FicheForm";

export default function Fiches() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();
  const [fiches, setFiches] = useState([]);
  const [search, setSearch] = useState("");
  const [familleFilter, setFamilleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Modale création
  const [openModal, setOpenModal] = useState(false);

  // Récupération fiches techniques
  const fetchFiches = () => {
    if (!claims?.mama_id || !isAuthenticated) return;
    setLoading(true);
    let query = supabase
      .from("fiches_techniques")
      .select("*", { count: "exact" })
      .eq("mama_id", claims.mama_id);

    if (search) query = query.ilike("nom", `%${search}%`);
    if (familleFilter) query = query.ilike("famille", `%${familleFilter}%`);
    if (activeFilter !== "all") query = query.eq("actif", activeFilter === "actif");
    query = query.order("famille", { ascending: true }).order("nom", { ascending: true });
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    query.then(({ data, error, count }) => {
      if (error) {
        setError("Erreur de chargement : " + error.message);
        setFiches([]);
      } else {
        setFiches(data || []);
        setTotal(count || 0);
        setError("");
      }
      setLoading(false);
    });
  };

  // Rafraîchir après création
  const handleCreated = () => {
    setOpenModal(false);
    fetchFiches();
    setPage(1);
  };

  useEffect(() => {
    fetchFiches();
    // eslint-disable-next-line
  }, [claims?.mama_id, isAuthenticated, search, familleFilter, activeFilter, page]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Toaster />
        <span className="text-mamastock-gold animate-pulse">
          Chargement des fiches techniques...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Toaster />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-mamastock-gold">
          Fiches techniques
        </h1>
        <Button
          className="bg-mamastock-gold text-white"
          onClick={() => setOpenModal(true)}
        >
          + Nouvelle fiche
        </Button>
      </div>
      <div className="flex gap-4 mb-4">
        <input
          className="input input-bordered"
          placeholder="Recherche nom fiche…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <input
          className="input input-bordered"
          placeholder="Filtrer par famille…"
          value={familleFilter}
          onChange={e => { setFamilleFilter(e.target.value); setPage(1); }}
        />
        <select
          className="select select-bordered"
          value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
        >
          <option value="all">Toutes</option>
          <option value="actif">Actives</option>
          <option value="inactif">Inactives</option>
        </select>
      </div>
      {error && (
        <div className="text-red-600 mb-2">{error}</div>
      )}
      <div className="bg-white shadow rounded-xl p-4 overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Famille</th>
              <th className="px-3 py-2">Rendement</th>
              <th className="px-3 py-2">Unité</th>
              <th className="px-3 py-2">Coût total (€)</th>
              <th className="px-3 py-2">Coût/portion (€)</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fiches.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  Aucune fiche technique trouvée.
                </td>
              </tr>
            ) : (
              fiches.map((f) => (
                <tr
                  key={f.id}
                  className={f.actif ? "" : "bg-gray-100 text-gray-500"}
                >
                  <td
                    className="px-3 py-2 cursor-pointer underline"
                    onClick={() => navigate(`/fiches/${f.id}`)}
                  >
                    {f.nom}
                  </td>
                  <td className="px-3 py-2">{f.famille || "-"}</td>
                  <td className="px-3 py-2">{f.rendement || "-"}</td>
                  <td className="px-3 py-2">{f.unite || "-"}</td>
                  <td className="px-3 py-2">{f.cout_total ? Number(f.cout_total).toFixed(2) : "-"}</td>
                  <td className="px-3 py-2">{f.cout_portion ? Number(f.cout_portion).toFixed(2) : "-"}</td>
                  <td className="px-3 py-2">
                    {f.actif ? (
                      <span className="text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Inactive</span>
                    )}
                  </td>
                  <td className="px-3 py-2 flex gap-2">
                    <Button
                      variant="outline"
                      className="btn-xs"
                      onClick={() => navigate(`/fiches/${f.id}`)}
                    >
                      Voir détail
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {total > pageSize && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => (
            <button
              key={i}
              className={`btn btn-xs ${page === i + 1 ? "bg-mamastock-gold text-white" : ""}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modale création fiche technique */}
      <AnimatePresence>
        {openModal && (
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogOverlay asChild>
              <_motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40"
              />
            </DialogOverlay>
            <DialogContent asChild>
              <_motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.22, type: "spring" }}
                className="max-w-2xl w-full bg-white rounded-xl shadow-2xl relative z-50"
              >
                <DialogHeader>
                  <DialogTitle>Nouvelle fiche technique</DialogTitle>
                  <DialogClose asChild>
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-mamastock-gold"
                      onClick={() => setOpenModal(false)}
                      aria-label="Fermer"
                    >
                      ✕
                    </button>
                  </DialogClose>
                </DialogHeader>
                <FicheForm onSave={handleCreated} onCancel={() => setOpenModal(false)} />
              </_motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
