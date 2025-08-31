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
  const [famille, setFamille] = useState(fiche?.famille || "");
  const [portions, setPortions] = useState(fiche?.portions || 1);
  const [rendement, setRendement] = useState(fiche?.rendement || 1);
    const initLinesSrc = Array.isArray(fiche?.lignes) ? fiche.lignes : [];
    const initLines = [];
    for (const l of initLinesSrc) {
      initLines.push({ type: 'produit', ...l });
    }
    const [lignes, setLignes] = useState(initLines);
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

    const addLigne = (type = 'produit') =>
      setLignes((prev) => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        arr.push({ type, produit_id: '', sous_fiche_id: '', quantite: 1 });
        return arr;
      });
    const updateLigne = (i, field, val) => {
      setLignes((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        const next = [];
        for (let idx = 0; idx < arr.length; idx++) {
          const l = arr[idx];
          if (idx !== i) {
            next.push(l);
            continue;
          }
          if (field === 'type') {
            next.push({ type: val, produit_id: '', sous_fiche_id: '', quantite: l.quantite });
          } else {
            next.push({ ...l, [field]: val });
          }
        }
        return next;
      });
    };
    const removeLigne = (i) =>
      setLignes((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        const next = [];
        for (let idx = 0; idx < arr.length; idx++) {
          if (idx !== i) next.push(arr[idx]);
        }
        return next;
      });

    const productList = Array.isArray(products) ? products : [];
    const ficheList = Array.isArray(ficheOptions) ? ficheOptions : [];
    const lineList = Array.isArray(lignes) ? lignes : [];
    let cout_total = 0;
    for (const l of lineList) {
      if (l.type === 'produit') {
        let prod;
        for (const p of productList) {
          if (p.id === l.produit_id) {
            prod = p;
            break;
          }
        }
        const prix = prod?.pmp ?? prod?.dernier_prix ?? 0;
        cout_total += Number(l.quantite) * Number(prix);
      } else {
        let sf;
        for (const f of ficheList) {
          if (f.id === l.sous_fiche_id) {
            sf = f;
            break;
          }
        }
        if (sf?.cout_par_portion) {
          cout_total += Number(l.quantite) * Number(sf.cout_par_portion);
        }
      }
    }
    const cout_par_portion = portions > 0 ? cout_total / portions : 0;
    const ratio = prixVente > 0 ? cout_par_portion / prixVente : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim()) return toast.error("Nom obligatoire");
    if (!portions || portions <= 0) return toast.error("Portions > 0");
      let incomplet = false;
      for (const l of lineList) {
        if (
          !l.quantite ||
          (l.type === 'produit' ? !l.produit_id : !l.sous_fiche_id)
        ) {
          incomplet = true;
          break;
        }
      }
      if (incomplet) return toast.error('Ligne incomplète');
    if (loading) return;
    setLoading(true);
    const payload = {
      nom,
      famille: famille || null,
      portions,
      rendement,
      prix_vente: prixVente || null,
        lignes: (() => {
          const arr = [];
          for (const l of lineList) {
            arr.push({
              type: l.type,
              produit_id: l.type === 'produit' ? l.produit_id : null,
              sous_fiche_id: l.type === 'sous_fiche' ? l.sous_fiche_id : null,
              quantite: l.quantite,
            });
          }
          return arr;
        })(),
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
          {(() => {
            const options = [];
            const fams = Array.isArray(familles) ? familles : [];
            for (const f of fams) {
              options.push(
                <option key={f.id} value={f.nom}>
                  {f.nom}
                </option>
              );
            }
            return options;
          })()}
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
                {(() => {
                  const rows = [];
                  for (let i = 0; i < lineList.length; i++) {
                    const l = lineList[i];
                    rows.push(
                      <FicheLigne
                        key={i}
                        ligne={l}
                        products={productList}
                        ficheOptions={ficheList}
                        onChange={(field, val) => updateLigne(i, field, val)}
                        onRemove={() => removeLigne(i)}
                      />
                    );
                  }
                  return rows;
                })()}
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
