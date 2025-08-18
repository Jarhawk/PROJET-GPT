// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from '@/hooks/useAuth';
import { useFiches } from "@/hooks/useFiches";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useFichesAutocomplete } from "@/hooks/useFichesAutocomplete";
import { Select } from "@/components/ui/select";
import TableContainer from "@/components/ui/TableContainer";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
import { toast } from 'sonner';
import FicheLigne from "@/components/fiches/FicheLigne.jsx";

export default function FicheForm({ fiche, onClose }) {
  const { access_rights, loading: authLoading } = useAuth();
  const { createFiche, updateFiche } = useFiches();
  const { products, fetchProducts } = useProducts();
  const { familles, fetchFamilles } = useFamilles();
  const [nom, setNom] = useState(fiche?.nom || "");
  const [famille, setFamille] = useState(fiche?.famille_id || "");
  const [portions, setPortions] = useState(fiche?.portions || 1);
  const [rendement, setRendement] = useState(fiche?.rendement || 1);
  const [lignes, setLignes] = useState(
    (fiche?.lignes || []).map(l => ({ type: "produit", ...l }))
  );
  const [prixVente, setPrixVente] = useState(fiche?.prix_vente || 0);
  const [loading, setLoading] = useState(false);

  const allowed = access_rights?.fiches_techniques?.peut_voir;
  const { results: ficheOptions, searchFiches } = useFichesAutocomplete();

  useEffect(() => {
    if (!allowed) return;
    fetchProducts({ sortBy: 'nom', limit: 1000 });
    fetchFamilles();
    searchFiches({ excludeId: fiche?.id });
  }, [allowed, fetchProducts, fetchFamilles, searchFiches, fiche?.id]);

  if (authLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  const addLigne = (type = "produit") =>
    setLignes([...lignes, { type, produit_id: "", sous_fiche_id: "", quantite: 1 }]);
  const updateLigne = (i, field, val) => {
    setLignes(lignes.map((l, idx) => {
      if (idx !== i) return l;
      if (field === 'type') {
        return { type: val, produit_id: '', sous_fiche_id: '', quantite: l.quantite };
      }
      return { ...l, [field]: val };
    }));
  };
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));

  const cout_total = lignes.reduce((sum, l) => {
    if (l.type === 'produit') {
      const prod = products.find(p => p.id === l.produit_id);
      const prix = prod?.pmp ?? prod?.dernier_prix ?? 0;
      return sum + Number(l.quantite) * Number(prix);
    }
    const sf = ficheOptions.find(f => f.id === l.sous_fiche_id);
    return sum + (sf?.cout_par_portion ? Number(l.quantite) * Number(sf.cout_par_portion) : 0);
  }, 0);
  const cout_par_portion = portions > 0 ? cout_total / portions : 0;
  const ratio = prixVente > 0 ? cout_par_portion / prixVente : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim()) return toast.error("Nom obligatoire");
    if (!portions || portions <= 0) return toast.error("Portions > 0");
    if (lignes.some(l => !l.quantite || (l.type === 'produit' ? !l.produit_id : !l.sous_fiche_id))) {
      return toast.error("Ligne incomplète");
    }
    if (loading) return;
    setLoading(true);
    const payload = {
      nom,
      famille_id: famille || null,
      portions,
      rendement,
      prix_vente: prixVente || null,
      lignes: lignes.map(l => ({
        type: l.type,
        produit_id: l.type === 'produit' ? l.produit_id : null,
        sous_fiche_id: l.type === 'sous_fiche' ? l.sous_fiche_id : null,
        quantite: l.quantite,
      })),
    };
    try {
      if (fiche?.id) {
        await updateFiche(fiche.id, payload);
        toast.success("Fiche mise à jour");
      } else {
        await createFiche(payload);
        toast.success("Fiche créée");
      }
      onClose?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard title={fiche ? "Modifier la fiche" : "Nouvelle fiche"}>
      <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        className="mb-2"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom"
        required
      />
      <Select
        className="mb-2"
        value={famille}
        onChange={e => setFamille(e.target.value)}
      >
        <option value="">-- Famille --</option>
        {familles.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
      </Select>
      <div className="flex gap-2 mb-2">
        <Input
          type="number"
          className="w-full"
          min={1}
          value={portions}
          onChange={e => setPortions(Number(e.target.value))}
          placeholder="Portions"
          required
        />
        <Input
          type="number"
          className="w-full"
          min={0}
          step="0.01"
          value={rendement}
          onChange={e => setRendement(Number(e.target.value))}
          placeholder="Rendement"
        />
        <Input
          type="number"
          className="w-full"
          min={0}
          step="0.01"
          value={prixVente}
          onChange={e => setPrixVente(Number(e.target.value))}
          placeholder="Prix vente HT"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Ingrédients :</label>
        <TableContainer>
          <table className="min-w-full mb-2 text-white">
            <thead>
              <tr>
                <th>Type</th>
                <th>Ref</th>
                <th>Quantité</th>
                <th>Unité</th>
                <th>PMP</th>
                <th>Coût</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <FicheLigne
                  key={i}
                  ligne={l}
                  products={products}
                  ficheOptions={ficheOptions}
                  onChange={(field, val) => updateLigne(i, field, val)}
                  onRemove={() => removeLigne(i)}
                />
              ))}
            </tbody>
          </table>
        </TableContainer>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => addLigne('produit')}>Ajouter produit</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => addLigne('sous_fiche')}>Ajouter sous-fiche</Button>
        </div>
      </div>
      <div className="mb-4 flex gap-4">
        <div><b>Coût total :</b> {cout_total.toFixed(2)} €</div>
        <div><b>Coût/portion :</b> {cout_par_portion.toFixed(2)} €</div>
        {prixVente > 0 && (
          <div><b>Ratio :</b> {(ratio * 100).toFixed(1)}%</div>
        )}
      </div>
        <div className="flex gap-2 mt-4">
          <PrimaryButton type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? "Enregistrement..." : fiche ? "Modifier" : "Créer"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose}>Annuler</SecondaryButton>
        </div>
      </form>
    </GlassCard>
  );
}
