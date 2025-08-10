// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useAchats } from "@/hooks/useAchats";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Unauthorized from "@/pages/auth/Unauthorized";

export default function AchatForm({ achat, fournisseurs = [], onClose }) {
  const { createAchat, updateAchat } = useAchats();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const { hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess("achats", "peut_modifier");
  const [date_achat, setDateAchat] = useState(achat?.date_achat || "");
  const [produit_id, setProduitId] = useState(achat?.produit_id || "");
  const [fournisseur_id, setFournisseurId] = useState(achat?.fournisseur_id || "");
  const [quantite, setQuantite] = useState(achat?.quantite || 1);
  const [prix, setPrix] = useState(achat?.prix || 0);
  const [loading, setLoading] = useState(false);


  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!produit_id || !fournisseur_id) return toast.error("Produit et fournisseur requis");
    setLoading(true);
    try {
      const payload = { produit_id, fournisseur_id, quantite, prix, date_achat };
      if (achat?.id) {
        await updateAchat(achat.id, payload);
        toast.success("Achat modifié");
      } else {
        const { error } = await createAchat(payload);
        if (error) throw error;
        toast.success("Achat ajouté");
      }
      onClose?.();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <GlassCard title={achat ? "Modifier l'achat" : "Nouvel achat"} className="p-6 space-y-2 min-w-[300px]">
        <form onSubmit={handleSubmit} className="space-y-2">
          <input type="date" className="form-input" value={date_achat} onChange={e => setDateAchat(e.target.value)} required />
          <AutoCompleteField
            label=""
            value={produit_id}
            onChange={obj => {
              setProduitId(obj?.id || "");
              if ((obj?.nom || "").length >= 2) searchProduits(obj.nom);
            }}
            options={produitOptions.map(p => ({ id: p.id, nom: p.nom }))}
          />
          <select className="form-input" value={fournisseur_id} onChange={e => setFournisseurId(e.target.value)} required>
            <option value="">Fournisseur</option>
            {fournisseurs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          <input type="number" className="form-input" value={quantite} onChange={e => setQuantite(Number(e.target.value))} />
          <input type="number" className="form-input" value={prix} onChange={e => setPrix(Number(e.target.value))} />
          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={loading}>{achat ? "Modifier" : "Ajouter"}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
