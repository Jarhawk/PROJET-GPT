// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useTransferts } from "@/hooks/useTransferts";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";

export default function TransfertForm({ onClose, onSaved }) {
  const { createTransfert } = useTransferts();
  const { products, fetchProducts } = useProducts();
  const { zones, fetchZones } = useZones();

  const [header, setHeader] = useState({
    zone_source_id: "",
    zone_destination_id: "",
    motif: "",
  });
  const [lignes, setLignes] = useState([{ produit_id: "", quantite: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts({});
    fetchZones();
  }, [fetchProducts, fetchZones]);

  const handleAddLine = () => {
    setLignes((l) => [...l, { produit_id: "", quantite: "" }]);
  };

  const handleLineChange = (idx, field, value) => {
    const next = [...lignes];
    next[idx][field] = value;
    setLignes(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!header.zone_source_id || !header.zone_destination_id) {
      toast.error("Zones requises");
      return;
    }
    if (header.zone_source_id === header.zone_destination_id) {
      toast.error("Zones différentes requises");
      return;
    }
    if (lignes.some((l) => !l.produit_id || Number(l.quantite) <= 0)) {
      toast.error("Produits et quantités obligatoires");
      return;
    }
    setSaving(true);
    const { error } = await createTransfert(header, lignes);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transfert enregistré");
    onSaved?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
      <GlassCard title="Nouveau transfert" className="w-[42rem]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <select
              className="input flex-1"
              value={header.zone_source_id}
              onChange={(e) =>
                setHeader((h) => ({ ...h, zone_source_id: e.target.value }))
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
              value={header.zone_destination_id}
              onChange={(e) =>
                setHeader((h) => ({ ...h, zone_destination_id: e.target.value }))
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
            className="textarea w-full"
            placeholder="Motif"
            value={header.motif}
            onChange={(e) => setHeader((h) => ({ ...h, motif: e.target.value }))}
          />
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="input"
                      value={l.produit_id}
                      onChange={(e) =>
                        handleLineChange(idx, "produit_id", e.target.value)
                      }
                    >
                      <option value="">Produit</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input w-24"
                      value={l.quantite}
                      onChange={(e) =>
                        handleLineChange(idx, "quantite", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button type="button" onClick={handleAddLine} className="mt-2">
            Ajouter une ligne
          </Button>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving}>
              Valider
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

