import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequisitions } from "@/hooks/useRequisitions";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { Toaster, toast } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

function RequisitionFormPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { createRequisition } = useRequisitions();
  const { products, loading: loadingProducts } = useProducts();

  const [type, setType] = useState("");
  const [motif, setMotif] = useState("");
  const [zone, setZone] = useState("");
  const [articles, setArticles] = useState([{ product_id: "", quantite: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  const handleChangeArticle = (index, field, value) => {
    const updated = [...articles];
    updated[index][field] = value;
    setArticles(updated);
  };

  const handleAddArticle = () => {
    setArticles([...articles, { product_id: "", quantite: 1 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !zone || articles.some(a => !a.product_id || !a.quantite)) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }
    if (submitting) return;
    const payload = {
      zone,
      type,
      motif,
      lignes: articles.map(a => ({ product_id: a.product_id, quantite: Number(a.quantite) })),
    };
    try {
      setSubmitting(true);
      const { success, message } = await createRequisition(payload);
      if (success) {
        toast.success("Réquisition créée !");
        navigate("/requisitions");
      } else {
        throw new Error(message);
      }
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
          <label className="block text-sm font-medium mb-1">Type</label>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Motif</label>
          <input
            type="text"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Zone</label>
          <input
            type="text"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Articles</h2>
          {articles.map((article, index) => (
            <div key={index} className="flex gap-4 mb-2">
              {loadingProducts ? (
                <div className="flex-1 flex items-center justify-center py-2">
                  <LoadingSpinner message="Chargement produits..." />
                </div>
              ) : (
                <select
                  value={article.product_id}
                  onChange={(e) =>
                    handleChangeArticle(index, "product_id", e.target.value)
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
