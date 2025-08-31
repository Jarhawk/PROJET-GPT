// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useInventaires } from "@/hooks/useInventaires";
import { useProduitsInventaire } from "@/hooks/useProduitsInventaire";
import { useInventaireZones } from "@/hooks/useInventaireZones";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Unauthorized from "@/pages/auth/Unauthorized";
import InventaireLigneRow from "@/components/inventaire/InventaireLigneRow";

export default function InventaireForm() {
  const navigate = useNavigate();
  const { createInventaire } = useInventaires();
  const { produits, fetchProduits } = useProduitsInventaire();
  const { zones, getZones } = useInventaireZones();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess("inventaires", "peut_modifier");

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [zone, setZone] = useState("");
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);

  const zoneSuggestions = [];
  if (Array.isArray(zones)) {
    for (const z of zones) zoneSuggestions.push(z.nom);
  }


  useEffect(() => {
    if (mama_id) {
      getZones();
    }
  }, [getZones, mama_id]);

  useEffect(() => {
    if (mama_id) {
      fetchProduits();
    }
  }, [fetchProduits, mama_id]);

  if (authLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!canEdit) {
    return <Unauthorized />;
  }

  const updateLine = (idx, newLigne) => {
    const updated = [];
    for (let i = 0; i < lignes.length; i++) {
      updated[i] = i === idx ? newLigne : lignes[i];
    }
    setLignes(updated);
  };

  const generateLines = () => {
    const rows = [];
    if (Array.isArray(produits)) {
      for (const p of produits) {
        rows.push({
          produit_id: p.id,
          nom: p.nom,
          unite: p.unite,
          pmp: p.pmp,
          stock_theorique: p.stock_theorique,
          quantite_reelle: p.stock_theorique,
        });
      }
    }
    setLignes(rows);
  };

  let totalValeur = 0;
  let totalEcart = 0;
  for (const l of lignes) {
    totalValeur += Number(l.quantite_reelle || 0) * Number(l.pmp || 0);
    totalEcart +=
      (Number(l.quantite_reelle || 0) - Number(l.stock_theorique || 0)) * Number(l.pmp || 0);
  }

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    if (!lignes.length) {
      toast.error("Ajoutez au moins un produit");
      return;
    }
    setLoading(true);
    let zoneObj = null;
    if (Array.isArray(zones)) {
      for (const z of zones) {
        if (z.nom === zone) {
          zoneObj = z;
          break;
        }
      }
    }
    const lignesPayload = [];
    for (const l of lignes) {
      lignesPayload.push({
        produit_id: l.produit_id,
        quantite_reelle: Number(l.quantite_reelle || 0),
      });
    }
    const payload = {
      date,
      zone_id: zoneObj?.id,
      lignes: lignesPayload,
    };
    try {
      const created = await createInventaire(payload);
      if (created) {
        toast.success("Inventaire enregistré !");
        navigate("/inventaire");
      }
    } catch (err) {
      toast.error(err?.message || "Erreur à l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard title="Nouvel inventaire" className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">

      <div className="flex gap-4">
        <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
        <input
          list="zones"
          className="form-input"
          placeholder="Zone"
          value={zone}
          onChange={e => setZone(e.target.value)}
        />
          <datalist id="zones">
            {(() => {
              const opts = [];
              for (const z of zoneSuggestions) {
                opts.push(<option key={z} value={z} />);
              }
              return opts;
            })()}
          </datalist>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={generateLines}>Générer lignes</Button>
      </div>
      {lignes.length > 0 && (
        <TableContainer>
          <table className="min-w-full text-sm text-center">
            <thead>
              <tr>
                <th className="p-2 text-left">Produit</th>
                <th className="p-2">Unité</th>
                <th className="p-2">Réel</th>
                <th className="p-2">Théorique</th>
                <th className="p-2">Écart</th>
                <th className="p-2">Valeur écart</th>
              </tr>
            </thead>
              <tbody>
                {(() => {
                  const rows = [];
                  for (let idx = 0; idx < lignes.length; idx++) {
                    const l = lignes[idx];
                    rows.push(
                      <InventaireLigneRow
                        key={l.produit_id}
                        ligne={l}
                        onChange={nl => updateLine(idx, nl)}
                      />
                    );
                  }
                  return rows;
                })()}
              </tbody>
          </table>
        </TableContainer>
      )}

      <div className="text-right font-semibold">
        Valeur totale : {totalValeur.toFixed(2)} € – Écart global : {totalEcart.toFixed(2)} €
      </div>

      <div className="flex gap-4">
        <PrimaryButton type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? "Enregistrement..." : "Enregistrer"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => navigate(-1)} disabled={loading}>Annuler</SecondaryButton>
      </div>
      </form>
    </GlassCard>
  );
}
