// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRequisitions } from "@/hooks/useRequisitions";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import { useUnites } from "@/hooks/useUnites";
import useAuth from "@/hooks/useAuth";
import { Toaster, toast } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PrimaryButton from "@/components/ui/PrimaryButton";

function RequisitionFormPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { createRequisition } = useRequisitions();
  const { products, loading: loadingProducts } = useProducts();
  const { myAccessibleZones } = useZones();
  const [zones, setZones] = useState([]);
  const { unites, fetchUnites } = useUnites();

  const [statut, setStatut] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [zone_id, setZone] = useState("");
  const [articles, setArticles] = useState([{ produit_id: "", unite_id: "", quantite: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { myAccessibleZones({ mode: 'requisition' }).then(setZones); fetchUnites(); }, [myAccessibleZones, fetchUnites]);

  useEffect(() => {
    if (zones.length > 0) setZone(zones[0].id);
  }, [zones]);

  const handleChangeArticle = (index, field, value) => {
    const updated = [...articles];
    updated[index][field] = value;
    setArticles(updated);
  };

  const handleAddArticle = () => {
    setArticles([...articles, { produit_id: "", unite_id: "", quantite: 1 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!statut || !zone_id || articles.some(a => !a.produit_id || !a.quantite || !a.unite_id)) {
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
        quantite: a.quantite,
        unite: unites.find(u => u.id === a.unite_id)?.nom || "",
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
      <GlassCard title="Nouvelle réquisition" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <Label htmlFor="statut">Statut</Label>
          <Select
            id="statut"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            required
            className="w-full"
          >
            <option value="">Sélectionner…</option>
            <option value="brouillon">Brouillon</option>
            <option value="faite">Faite</option>
            <option value="réalisée">Réalisée</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="commentaire">Commentaire</Label>
          <Input
            id="commentaire"
            type="text"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            className="w-full"
          />
        </div>

        {zone_id && (
          <div>
            <Label>Zone</Label>
            <div className="p-2 border rounded bg-muted/20">
              {zones.find(z => z.id === zone_id)?.nom || "cave"}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Articles</h2>
          {articles.map((article, index) => (
            <div key={index} className="flex gap-4 mb-2 items-end">
              {loadingProducts ? (
                <div className="flex-1 flex items-center justify-center py-2">
                  <LoadingSpinner message="Chargement produits..." />
                </div>
              ) : (
                <Select
                  value={article.produit_id}
                  onChange={(e) =>
                    handleChangeArticle(index, "produit_id", e.target.value)
                  }
                  className="flex-1"
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </Select>
              )}
              <Select
                value={article.unite_id}
                onChange={(e) => handleChangeArticle(index, "unite_id", e.target.value)}
                className="w-32"
                required
              >
                <option value="">Unité</option>
                {unites.map(u => (
                  <option key={u.id} value={u.id}>{u.nom}</option>
                ))}
              </Select>
              <Input
                type="number"
                value={article.quantite}
                onChange={(e) => handleChangeArticle(index, "quantite", e.target.value)}
                className="w-24"
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
          <PrimaryButton type="submit" disabled={submitting}>
            Enregistrer
          </PrimaryButton>
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
