import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import FicheForm from "@/components/fiches/FicheForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

export default function FicheDetail() {
  const { id } = useParams();
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();
  const [fiche, setFiche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [produits, setProduits] = useState({});
  const [sousRecettes, setSousRecettes] = useState({});
  const [error, setError] = useState("");
  const [editModal, setEditModal] = useState(false);

  // Pour mise à jour (après édition)
  const reloadFiche = () => {
    if (!id || !claims?.mama_id) return;
    setLoading(true);
    supabase
      .from("fiches_techniques")
      .select("*")
      .eq("id", id)
      .eq("mama_id", claims.mama_id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Fiche introuvable ou accès refusé.");
          setFiche(null);
        } else {
          setFiche(data);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    reloadFiche();
    // eslint-disable-next-line
  }, [id, claims?.mama_id, isAuthenticated]);

  // Charger détails produits et sous-recettes pour affichage
  useEffect(() => {
    if (!fiche?.lignes || fiche.lignes.length === 0 || !claims?.mama_id) return;
    const prodIds = fiche.lignes.filter(l => l.type === "produit").map(l => l.item_id);
    const sousIds = fiche.lignes.filter(l => l.type === "sousrecette").map(l => l.item_id);
    Promise.all([
      prodIds.length
        ? supabase.from("products").select("id, nom, unite, pmp").in("id", prodIds).eq("mama_id", claims.mama_id)
        : Promise.resolve({ data: [] }),
      sousIds.length
        ? supabase.from("fiches_techniques").select("id, nom, unite, rendement, cout_total").in("id", sousIds).eq("mama_id", claims.mama_id)
        : Promise.resolve({ data: [] }),
    ]).then(([prodRes, sousRes]) => {
      setProduits(Object.fromEntries((prodRes.data || []).map(p => [p.id, p])));
      setSousRecettes(Object.fromEntries((sousRes.data || []).map(s => [s.id, s])));
    });
  }, [fiche, claims?.mama_id]);

  // Changer statut fiche
  const handleActivate = async () => {
    if (!fiche) return;
    const { error } = await supabase
      .from("fiches_techniques")
      .update({ actif: !fiche.actif })
      .eq("id", fiche.id)
      .eq("mama_id", claims.mama_id);
    if (error) {
      toast.error("Erreur lors de la modification.");
    } else {
      toast.success(fiche.actif ? "Fiche désactivée." : "Fiche activée.");
      setFiche(f => f ? { ...f, actif: !f.actif } : f);
    }
  };

  // Après édition
  const handleEdited = () => {
    setEditModal(false);
    reloadFiche();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Toaster />
        <span className="text-mamastock-gold animate-pulse">
          Chargement de la fiche technique...
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !fiche) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-red-700">
        {error || "Fiche technique introuvable ou accès refusé."}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Toaster />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-mamastock-gold">
          Fiche technique : {fiche.nom}
        </h1>
        <div className="flex gap-2">
          <Button
            className={fiche.actif ? "bg-red-500 text-white" : "bg-green-500 text-white"}
            onClick={handleActivate}
            variant="secondary"
          >
            {fiche.actif ? "Désactiver" : "Activer"}
          </Button>
          <Button
            className="ml-2"
            variant="secondary"
            onClick={() => setEditModal(true)}
          >
            Modifier
          </Button>
        </div>
      </div>
      {/* Infos générales */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <p><strong>Famille :</strong> {fiche.famille || "-"}</p>
        <p><strong>Rendement :</strong> {fiche.rendement} {fiche.unite}</p>
        <p><strong>Coût matière total :</strong> {fiche.cout_total ? Number(fiche.cout_total).toFixed(2) : "-"} €</p>
        <p><strong>Coût/portion :</strong> {fiche.cout_portion ? Number(fiche.cout_portion).toFixed(2) : "-"} €</p>
        <p>
          <strong>Statut :</strong>{" "}
          {fiche.actif
            ? <span className="text-green-600 font-semibold">Active</span>
            : <span className="text-red-600 font-semibold">Inactive</span>
          }
        </p>
      </div>
      {/* Ingrédients/sous-recettes */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-mamastock-gold mb-2">Ingrédients & Sous-recettes</h2>
        <table className="min-w-full table-auto mb-2">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">Quantité</th>
              <th className="px-2 py-1">Unité</th>
              <th className="px-2 py-1">Coût ligne (€)</th>
            </tr>
          </thead>
          <tbody>
            {(!fiche.lignes || fiche.lignes.length === 0) && (
              <tr>
                <td colSpan={5} className="py-3 text-center text-gray-500">
                  Aucun ingrédient/sous-recette enregistré.
                </td>
              </tr>
            )}
            {fiche.lignes && fiche.lignes.map((l, idx) => {
              let nom = l.nom;
              let type = l.type === "sousrecette" ? "Sous-recette" : "Produit";
              if (l.type === "produit" && produits[l.item_id]) {
                nom = produits[l.item_id].nom;
              }
              if (l.type === "sousrecette" && sousRecettes[l.item_id]) {
                nom = sousRecettes[l.item_id].nom;
              }
              return (
                <tr key={idx}>
                  <td className="px-2 py-1">{nom}</td>
                  <td className="px-2 py-1">{type}</td>
                  <td className="px-2 py-1">{l.quantite}</td>
                  <td className="px-2 py-1">{l.unite}</td>
                  <td className="px-2 py-1">{Number(l.cout).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button className="btn" onClick={() => navigate("/fiches")}>
          Retour à la liste
        </Button>
      </div>
      {/* MODALE ÉDITION fiche technique */}
      <AnimatePresence>
        {editModal && (
          <Dialog open={editModal} onOpenChange={setEditModal}>
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
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.18, type: "spring" }}
                className="max-w-2xl w-full bg-white rounded-xl shadow-2xl relative z-50"
              >
                <DialogHeader>
                  <DialogTitle>Modifier la fiche technique</DialogTitle>
                  <DialogClose asChild>
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-mamastock-gold"
                      onClick={() => setEditModal(false)}
                      aria-label="Fermer"
                    >
                      ✕
                    </button>
                  </DialogClose>
                </DialogHeader>
                <FicheForm initialData={fiche} onSave={handleEdited} onCancel={() => setEditModal(false)} />
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
