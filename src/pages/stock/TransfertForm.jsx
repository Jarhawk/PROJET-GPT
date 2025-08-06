// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useTransferts } from "@/hooks/useTransferts";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";

export default function TransfertForm({ onClose, onSaved }) {
  const { createTransfert } = useTransferts();
  const { products, fetchProducts } = useProducts();
  const { zones, fetchZones } = useZones();

  const [formHead, setFormHead] = useState({
    zone_source_id: "",
    zone_dest_id: "",
    commentaire: "",
  });
  const [lignes, setLignes] = useState([
    { produit_id: "", quantite: 0, commentaire: "", stock_avant: 0, stock_apres: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts({});
    fetchZones();
  }, [fetchProducts, fetchZones]);

  const handleAddLine = () => {
    setLignes(l => [
      ...l,
      { produit_id: "", quantite: 0, commentaire: "", stock_avant: 0, stock_apres: 0 },
    ]);
  };

  const fetchStock = async produitId => {
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

  const handleSubmit = async e => {
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
    if (lignes.some(l => !l.produit_id || !l.quantite)) {
      toast.error("Produits et quantités obligatoires");
      return;
    }
    setSaving(true);
    const payloadLines = lignes.map(l => ({
      produit_id: l.produit_id,
      quantite: Number(l.quantite),
      commentaire: l.commentaire,
    }));
    const { error } = await createTransfert(formHead, payloadLines);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transfert enregistré");
    setFormHead({ zone_source_id: "", zone_dest_id: "", commentaire: "" });
    setLignes([{ produit_id: "", quantite: 0, commentaire: "", stock_avant: 0, stock_apres: 0 }]);
    onSaved?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
      <GlassCard title="Nouveau transfert" className="w-[42rem]">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <select
              className="input flex-1"
              value={formHead.zone_source_id}
              onChange={e => setFormHead(f => ({ ...f, zone_source_id: e.target.value }))}
            >
              <option value="">Zone source</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.nom}</option>
              ))}
            </select>
            <select
              className="input flex-1"
              value={formHead.zone_dest_id}
              onChange={e => setFormHead(f => ({ ...f, zone_dest_id: e.target.value }))}
            >
              <option value="">Zone destination</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.nom}</option>
              ))}
            </select>
          </div>
          <textarea
            className="textarea w-full"
            placeholder="Commentaire"
            value={formHead.commentaire}
            onChange={e => setFormHead(f => ({ ...f, commentaire: e.target.value }))}
          />
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="input"
                      value={l.produit_id}
                      onChange={e => handleLineChange(idx, "produit_id", e.target.value)}
                    >
                      <option value="">Produit</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.nom}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input w-24"
                      value={l.quantite}
                      onChange={e => handleLineChange(idx, "quantite", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input"
                      placeholder="Commentaire"
                      value={l.commentaire}
                      onChange={e => handleLineChange(idx, "commentaire", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button type="button" onClick={handleAddLine} className="mt-2">
            Ajouter une ligne
          </Button>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="submit" disabled={saving}>Valider</Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
