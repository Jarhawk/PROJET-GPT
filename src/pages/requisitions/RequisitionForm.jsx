import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequisitions } from "@/hooks/useRequisitions";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";

function RequisitionFormPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { createRequisition } = useRequisitions();
  const { data: products, loading: loadingProducts } = useProducts();

  const [type, setType] = useState("");
  const [motif, setMotif] = useState("");
  const [zone, setZone] = useState("");
  const [articles, setArticles] = useState([{ product_id: "", quantite: 1 }]);

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
    await createRequisition({ type, motif, zone, articles });
    navigate("/requisitions");
  };

  if (authLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-mamastock-gold mb-6">Nouvelle réquisition</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">

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
              <select
                value={article.product_id}
                onChange={(e) => handleChangeArticle(index, "product_id", e.target.value)}
                className="flex-1 border rounded px-3 py-2"
                required
              >
                <option value="">Sélectionner un produit</option>
                {loadingProducts ? (
                  <option disabled>Chargement...</option>
                ) : (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))
                )}
              </select>
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
          <button type="submit" className="bg-mamastock-gold text-white px-4 py-2 rounded">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RequisitionForm() {
  return (
    <RequisitionFormPage />
  );
}
