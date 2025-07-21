// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRequisitions } from "@/hooks/useRequisitions";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

function RequisitionFormPage() {
  const navigate = useNavigate();
  const { mama_id, loading: authLoading } = useAuth();
  const { createRequisition } = useRequisitions();
  const { products, loading: loadingProducts } = useProducts();
  const { zones, fetchZones } = useZones();

  const [statut, setStatut] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [zone_id, setZone] = useState("");
  const [articles, setArticles] = useState([{ produit_id: "", quantite: 1, stock_avant: 0, stock_apres: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const fetchStock = async (produitId) => {
    if (!produitId || !zone_id || !mama_id) return 0;
    const { data } = await supabase
      .from('stocks')
      .select('quantite')
      .eq('mama_id', mama_id)
      .eq('zone_id', zone_id)
      .eq('produit_id', produitId)
      .maybeSingle();
    return Number(data?.quantite || 0);
  };

  const handleChangeArticle = async (index, field, value) => {
    const updated = [...articles];
    updated[index][field] = value;
    if (field === 'produit_id') {
      const stock = await fetchStock(value);
      updated[index].stock_avant = stock;
      updated[index].stock_apres = stock - (Number(updated[index].quantite) || 0);
    }
    if (field === 'quantite') {
      updated[index].stock_apres = (Number(updated[index].stock_avant) || 0) - Number(value);
    }
    setArticles(updated);
  };

  const handleAddArticle = () => {
    setArticles([...articles, { produit_id: "", quantite: 1, stock_avant: 0, stock_apres: 0 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!statut || !zone_id || articles.some(a => !a.produit_id || !a.quantite)) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }
    if (submitting) return;
    const payload = {
      statut,
      commentaire,
      zone_id,
      lignes: articles.map(a => ({
        produit_id: a.produit_id,
        quantite_demandee: a.quantite,
        stock_theorique_avant: a.stock_avant,
        stock_theorique_apres: a.stock_apres,
      })),
    };
    try {
      setSubmitting(true);
      const { error } = await createRequisition(payload);
      if (error) throw new Error(error.message);
      toast.success("Réquisition créée !");
      navigate("/requisitions");
    } catch (err) {
      toast.error(err.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold text-mamastock-gold mb-6">Nouvelle réquisition</h1>
      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium mb-1">Statut</label>
          <input
            type="text"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Commentaire</label>
          <input
            type="text"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Zone de stock</label>
          <select
            value={zone_id}
            onChange={(e) => setZone(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Sélectionner…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Articles</h2>
          {articles.map((article, index) => (
            <div key={index} className="flex gap-4 mb-2 items-end">
              {loadingProducts ? (
                <div className="flex-1 flex items-center justify-center py-2">
                  <LoadingSpinner message="Chargement produits..." />
                </div>
              ) : (
                <select
                  value={article.produit_id}
                  onChange={(e) =>
                    handleChangeArticle(index, "produit_id", e.target.value)
                  }
                  className="flex-1 border rounded px-3 py-2"
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="number"
                value={article.quantite}
                onChange={(e) => handleChangeArticle(index, "quantite", e.target.value)}
                className="w-24 border rounded px-2 py-2"
                min="1"
                required
              />
              <div className="text-sm">
                <div>Stock: {article.stock_avant}</div>
                <div className="text-xs text-muted">Après: {article.stock_apres}</div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddArticle}
            className="mt-2 text-sm text-mamastock-gold hover:underline"
          >
            + Ajouter un article
          </button>
        </div>

        <div className="text-right">
          <button type="submit" disabled={submitting} className="bg-mamastock-gold text-white px-4 py-2 rounded disabled:opacity-50">
            Enregistrer
          </button>
        </div>
        </form>
      </GlassCard>
    </div>
  );
}

export default function RequisitionForm() {
  return (
    <RequisitionFormPage />
  );
}
