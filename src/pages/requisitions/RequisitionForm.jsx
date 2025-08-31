// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRequisitions } from "@/hooks/useRequisitions";
import { useZoneProducts } from "@/hooks/useZoneProducts";
import { useZones } from "@/hooks/useZones";
import { useUnites } from "@/hooks/useUnites";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
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
  const { list: listZoneProducts } = useZoneProducts();
  const { myAccessibleZones } = useZones();
  const [zones, setZones] = useState([]);
  const { unites, fetchUnites } = useUnites();

  const [statut, setStatut] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [zone_id, setZone] = useState("");
  const [articles, setArticles] = useState([{ produit_id: "", unite_id: "", quantite: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const [zoneProducts, setZoneProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    myAccessibleZones({ mode: 'requisition' }).then((z) =>
      setZones(Array.isArray(z) ? z : [])
    );
    fetchUnites();
  }, [myAccessibleZones, fetchUnites]);

  useEffect(() => {
    if (Array.isArray(zones) && zones.length > 0) setZone(zones[0].id);
  }, [zones]);

  useEffect(() => {
    if (!zone_id) return;
    setLoadingProducts(true);
    listZoneProducts(zone_id).then((p) => {
      setZoneProducts(Array.isArray(p) ? p : []);
      setLoadingProducts(false);
    });
  }, [zone_id, listZoneProducts]);

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
    let invalid = false;
    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      if (!a.produit_id || !a.quantite || !a.unite_id) {
        invalid = true;
        break;
      }
    }
    if (!statut || !zone_id || invalid) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }
    if (submitting) return;
    const safeUnites = Array.isArray(unites) ? unites : [];
    const lignes = [];
    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      let uniteNom = "";
      for (let j = 0; j < safeUnites.length; j++) {
        const u = safeUnites[j];
        if (u.id === a.unite_id) {
          uniteNom = u.nom;
          break;
        }
      }
      lignes.push({
        produit_id: a.produit_id,
        quantite: a.quantite,
        unite: uniteNom,
      });
    }
    const payload = { statut, commentaire, zone_id, lignes };
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
              {(() => {
                let nom = "cave";
                const arr = Array.isArray(zones) ? zones : [];
                for (let i = 0; i < arr.length; i++) {
                  const z = arr[i];
                  if (z.id === zone_id) {
                    nom = z.nom;
                    break;
                  }
                }
                return nom;
              })()}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Articles</h2>
          {(() => {
            const rows = [];
            for (let index = 0; index < articles.length; index++) {
              const article = articles[index];
              const productOptions = [];
              const zp = Array.isArray(zoneProducts) ? zoneProducts : [];
              for (let i = 0; i < zp.length; i++) {
                const p = zp[i];
                productOptions.push(
                  <option key={p.produit_id || p.id} value={p.produit_id || p.id}>
                    {p.produit_nom || p.nom}
                  </option>
                );
              }
              const uniteOptions = [];
              const uni = Array.isArray(unites) ? unites : [];
              for (let i = 0; i < uni.length; i++) {
                const u = uni[i];
                uniteOptions.push(
                  <option key={u.id} value={u.id}>
                    {u.nom}
                  </option>
                );
              }
              rows.push(
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
                      {productOptions}
                    </Select>
                  )}
                  <Select
                    value={article.unite_id}
                    onChange={(e) =>
                      handleChangeArticle(index, "unite_id", e.target.value)
                    }
                    className="w-32"
                    required
                  >
                    <option value="">Unité</option>
                    {uniteOptions}
                  </Select>
                  <Input
                    type="number"
                    value={article.quantite}
                    onChange={(e) =>
                      handleChangeArticle(index, "quantite", e.target.value)
                    }
                    className="w-24"
                    min="1"
                    required
                  />
                </div>
              );
            }
            return rows;
          })()}
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
