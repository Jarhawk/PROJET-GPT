import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import FournisseurForm from "@/components/fournisseurs/FournisseurForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

export default function Fournisseurs() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [search, setSearch] = useState("");
  const [villeFilter, setVilleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Modale FournisseurForm
  const [openModal, setOpenModal] = useState(false);

  // Fetch fournisseurs
  const fetchFournisseurs = () => {
    if (!claims?.mama_id || !isAuthenticated) return;
    setLoading(true);
    let query = supabase
      .from("suppliers")
      .select("*", { count: "exact" })
      .eq("mama_id", claims.mama_id);

    if (search) query = query.ilike("nom", `%${search}%`);
    if (villeFilter) query = query.ilike("ville", `%${villeFilter}%`);
    if (activeFilter !== "all") query = query.eq("actif", activeFilter === "actif");
    query = query.order("nom", { ascending: true });
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    query.then(({ data, error, count }) => {
      if (error) {
        setError("Erreur de chargement : " + error.message);
        setFournisseurs([]);
      } else {
        setFournisseurs(data || []);
        setTotal(count || 0);
        setError("");
      }
      setLoading(false);
    });
  };

  // Rafraîchir la liste après ajout/modif
  const handleCreated = () => {
    setOpenModal(false);
    fetchFournisseurs();
    setPage(1);
  };

  useEffect(() => {
    fetchFournisseurs();
    // eslint-disable-next-line
  }, [claims?.mama_id, isAuthenticated, search, villeFilter, activeFilter, page]);

  const handleActivate = async (id, actif) => {
    const { error } = await supabase
      .from("suppliers")
      .update({ actif: !actif })
      .eq("id", id)
      .eq("mama_id", claims.mama_id);
    if (error) {
      toast.error("Erreur lors de la modification.");
    } else {
      toast.success(actif ? "Fournisseur désactivé." : "Fournisseur activé.");
      fetchFournisseurs();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Toaster />
        <span className="text-mamastock-gold animate-pulse">
          Chargement des fournisseurs...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Toaster />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-mamastock-gold">
          Fournisseurs
        </h1>
        <Button
          className="bg-mamastock-gold text-white"
          onClick={() => setOpenModal(true)}
        >
          + Nouveau fournisseur
        </Button>
      </div>
      <div className="flex gap-4 mb-4">
        <input
          className="input input-bordered"
          placeholder="Recherche nom fournisseur…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <input
          className="input input-bordered"
          placeholder="Filtrer par ville…"
          value={villeFilter}
          onChange={e => { setVilleFilter(e.target.value); setPage(1); }}
        />
        <select
          className="select select-bordered"
          value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
        >
          <option value="all">Tous</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
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
              <th className="px-3 py-2">Ville</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Téléphone</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fournisseurs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Aucun fournisseur trouvé.
                </td>
              </tr>
            ) : (
              fournisseurs.map((f) => (
                <tr
                  key={f.id}
                  className={f.actif ? "" : "bg-gray-100 text-gray-500"}
                >
                  <td
                    className="px-3 py-2 cursor-pointer underline"
                    onClick={() => navigate(`/fournisseurs/${f.id}`)}
                  >
                    {f.nom}
                  </td>
                  <td className="px-3 py-2">{f.ville || "-"}</td>
                  <td className="px-3 py-2">{f.email || "-"}</td>
                  <td className="px-3 py-2">{f.telephone || "-"}</td>
                  <td className="px-3 py-2">
                    {f.actif ? (
                      <span className="text-green-600 font-semibold">Actif</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Inactif</span>
                    )}
                  </td>
                  <td className="px-3 py-2 flex gap-2">
                    <Button
                      variant="secondary"
                      className={`${f.actif ? "bg-red-500" : "bg-green-500"} text-white btn-xs`}
                      onClick={() => handleActivate(f.id, f.actif)}
                    >
                      {f.actif ? "Désactiver" : "Activer"}
                    </Button>
                    <Button
                      variant="outline"
                      className="btn-xs"
                      onClick={() => navigate(`/fournisseurs/${f.id}`)}
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

      {/* Modale ultra-pro pour création fournisseur */}
      <AnimatePresence>
        {openModal && (
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogOverlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40"
              />
            </DialogOverlay>
            <DialogContent asChild>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.22, type: "spring" }}
                className="max-w-lg w-full bg-white rounded-xl shadow-2xl relative z-50"
              >
                <DialogHeader>
                  <DialogTitle>Nouveau fournisseur</DialogTitle>
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
                <FournisseurForm onSave={handleCreated} onCancel={() => setOpenModal(false)} />
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
