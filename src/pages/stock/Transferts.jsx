// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { useTransferts } from "@/hooks/useTransferts";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import TableHeader from "@/components/ui/TableHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";

export default function Transferts() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { products, fetchProducts } = useProducts();
  const { zones, fetchZones } = useZones();
  const { transferts, fetchTransferts, createTransfert } = useTransferts();

  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [formHead, setFormHead] = useState({
    zone_source_id: "",
    zone_dest_id: "",
    commentaire: "",
  });
  const [lignes, setLignes] = useState([
    {
      produit_id: "",
      quantite: 0,
      commentaire: "",
      stock_avant: 0,
      stock_apres: 0,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProducts({});
    fetchZones();
  }, [fetchProducts, fetchZones]);

  useEffect(() => {
    if (periode.debut && periode.fin)
      fetchTransferts({ debut: periode.debut, fin: periode.fin });
  }, [periode, fetchTransferts]);

  const handleAddLine = () => {
    setLignes((l) => [
      ...l,
      {
        produit_id: "",
        quantite: 0,
        commentaire: "",
        stock_avant: 0,
        stock_apres: 0,
      },
    ]);
  };

  const fetchStock = async (produitId) => {
    if (!formHead.zone_source_id || !produitId) return 0;
    const { data, error } = await supabase
      .from("stocks")
      .select("quantite")
      .eq("zone_id", formHead.zone_source_id)
      .eq("produit_id", produitId)
      .maybeSingle();
    if (error) return 0;
    return Number(data?.quantite || 0);
  };

  const handleLineChange = async (index, field, value) => {
    const updated = [...lignes];
    updated[index][field] = value;
    if (field === "produit_id") {
      const stock = await fetchStock(value);
      updated[index].stock_avant = stock;
      updated[index].stock_apres = stock - Number(updated[index].quantite || 0);
    }
    if (field === "quantite") {
      updated[index].stock_apres =
        (Number(updated[index].stock_avant) || 0) - Number(value || 0);
    }
    setLignes(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!formHead.zone_source_id || !formHead.zone_dest_id) {
      toast.error("Zones requises");
      return;
    }
    if (formHead.zone_source_id === formHead.zone_dest_id) {
      toast.error("Zones différentes requises");
      return;
    }
    if (lignes.some((l) => !l.produit_id || !l.quantite)) {
      toast.error("Produits et quantités obligatoires");
      return;
    }
    setSaving(true);
    const payloadLines = lignes.map((l) => ({
      produit_id: l.produit_id,
      quantite: Number(l.quantite),
      commentaire: l.commentaire,
    }));
    const { error } = await createTransfert(formHead, payloadLines);
    if (error) toast.error(error.message);
    else {
      toast.success("Transfert enregistré");
      setShowForm(false);
      setFormHead({ zone_source_id: "", zone_dest_id: "", commentaire: "" });
      setLignes([
        {
          produit_id: "",
          quantite: 0,
          commentaire: "",
          stock_avant: 0,
          stock_apres: 0,
        },
      ]);
      if (periode.debut && periode.fin)
        fetchTransferts({ debut: periode.debut, fin: periode.fin });
    }
    setSaving(false);
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!isAuthenticated) return null;

  return (
    <div className="p-6 space-y-4">
      <TableHeader className="items-end gap-4">
        <div>
          <label>Début</label>
          <input
            type="date"
            className="form-input"
            value={periode.debut}
            onChange={(e) =>
              setPeriode((p) => ({ ...p, debut: e.target.value }))
            }
          />
        </div>
        <div>
          <label>Fin</label>
          <input
            type="date"
            className="form-input"
            value={periode.fin}
            onChange={(e) => setPeriode((p) => ({ ...p, fin: e.target.value }))}
          />
        </div>
        <Button onClick={() => setShowForm(true)}>Nouveau transfert</Button>
      </TableHeader>
      <ListingContainer>
        <table className="text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Zone source</th>
              <th>Zone destination</th>
              <th className="text-right">Quantité</th>
            </tr>
          </thead>
          <tbody>
            {transferts.map((t) => (
              <tr key={t.transfert_id}>
                <td>{t.date_transfert}</td>
                <td>
                  {products.find((p) => p.id === t.produit_id)?.nom || ""}
                </td>
                <td>
                  {zones.find((z) => z.id === t.zone_source_id)?.nom || ""}
                </td>
                <td>{zones.find((z) => z.id === t.zone_dest_id)?.nom || ""}</td>
                <td className="text-right">{t.quantite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListingContainer>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50">
          <GlassCard title="Nouveau transfert" className="w-96 p-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={formHead.zone_source_id}
                  onChange={(e) =>
                    setFormHead((h) => ({
                      ...h,
                      zone_source_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Zone source</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nom}
                    </option>
                  ))}
                </select>
                <select
                  className="input flex-1"
                  value={formHead.zone_dest_id}
                  onChange={(e) =>
                    setFormHead((h) => ({ ...h, zone_dest_id: e.target.value }))
                  }
                >
                  <option value="">Zone destination</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nom}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="input w-full"
                rows="2"
                placeholder="Commentaire"
                value={formHead.commentaire}
                onChange={(e) =>
                  setFormHead((h) => ({ ...h, commentaire: e.target.value }))
                }
              />
              {lignes.map((l, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <select
                    className="input flex-1"
                    value={l.produit_id}
                    onChange={(e) =>
                      handleLineChange(i, "produit_id", e.target.value)
                    }
                  >
                    <option value="">Produit</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input w-20"
                    min="0"
                    value={l.quantite}
                    onChange={(e) =>
                      handleLineChange(i, "quantite", e.target.value)
                    }
                  />
                  <span className="text-xs">
                    {l.stock_avant}→{l.stock_apres}
                  </span>
                </div>
              ))}
              <Button type="button" onClick={handleAddLine}>
                Ajouter produit
              </Button>
              <div className="flex gap-2 justify-end">
                <Button type="submit" disabled={saving}>
                  Valider
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
