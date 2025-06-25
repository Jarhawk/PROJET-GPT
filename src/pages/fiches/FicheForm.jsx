import { useState, useEffect } from "react";
// ✅ Vérifié
import { useFiches } from "@/hooks/useFiches";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import TableContainer from "@/components/ui/TableContainer";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function FicheForm({ fiche, onClose }) {
  const { createFiche, updateFiche } = useFiches();
  const { products, fetchProducts } = useProducts();
  const { familles, fetchFamilles } = useFamilles();
  const [nom, setNom] = useState(fiche?.nom || "");
  const [famille, setFamille] = useState(fiche?.famille_id || "");
  const [portions, setPortions] = useState(fiche?.portions || 1);
  const [rendement, setRendement] = useState(fiche?.rendement || 1);
  const [lignes, setLignes] = useState(fiche?.lignes || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchProducts(); fetchFamilles(); }, [fetchProducts, fetchFamilles]);

  const addLigne = () => setLignes([...lignes, { product_id: "", quantite: 1 }]);
  const updateLigne = (i, field, val) => {
    setLignes(lignes.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));

  const cout_total = lignes.reduce((sum, l) => {
    const prod = products.find(p => p.id === l.product_id);
    return sum + (prod?.pmp ? Number(l.quantite) * Number(prod.pmp) : 0);
  }, 0);
  const cout_par_portion = portions > 0 ? cout_total / portions : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nom.trim()) return toast.error("Nom obligatoire");
    if (!portions || portions <= 0) return toast.error("Portions > 0");
    if (lignes.some(l => !l.product_id || !l.quantite)) {
      return toast.error("Ligne incomplète");
    }
    if (loading) return;
    setLoading(true);
    const payload = {
      nom,
      famille_id: famille || null,
      portions,
      rendement,
      lignes,
    };
    console.log("DEBUG form", payload);
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
      console.log("DEBUG error", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-glass backdrop-blur-lg text-white p-6 rounded-lg shadow-md max-w-2xl mx-auto text-shadow">
      <h2 className="text-lg font-bold mb-4">{fiche ? "Modifier la fiche" : "Nouvelle fiche"}</h2>
      <input className="input mb-2" value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" required />
      <select className="input mb-2" value={famille} onChange={e => setFamille(e.target.value)}>
        <option value="">-- Famille --</option>
        {familles.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
      </select>
      <div className="flex gap-2 mb-2">
        <input type="number" className="input" min={1} value={portions} onChange={e => setPortions(Number(e.target.value))} placeholder="Portions" required />
        <input type="number" className="input" min={0} step="0.01" value={rendement} onChange={e => setRendement(Number(e.target.value))} placeholder="Rendement" />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Ingrédients :</label>
        <TableContainer>
          <table className="min-w-full mb-2 text-white">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Unité</th>
                <th>PMP</th>
                <th>Coût</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => {
                const prod = products.find(p => p.id === l.product_id);
                return (
                  <tr key={i}>
                    <td>
                      <select className="input" value={l.product_id} onChange={e => updateLigne(i, 'product_id', e.target.value)} required>
                        <option value="">Sélectionner</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="number" className="input" min={0} step="0.01" value={l.quantite} onChange={e => updateLigne(i, 'quantite', Number(e.target.value))} required />
                    </td>
                    <td>{prod?.unite || '-'}</td>
                    <td>{prod?.pmp ? prod.pmp.toFixed(2) : '-'}</td>
                    <td>{prod?.pmp ? (prod.pmp * l.quantite).toFixed(2) : '-'}</td>
                    <td><Button size="sm" variant="outline" onClick={() => removeLigne(i)}>Suppr.</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableContainer>
        <Button type="button" size="sm" variant="outline" onClick={addLigne}>Ajouter ingrédient</Button>
      </div>
      <div className="mb-4 flex gap-4">
        <div><b>Coût total :</b> {cout_total.toFixed(2)} €</div>
        <div><b>Coût/portion :</b> {cout_par_portion.toFixed(2)} €</div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{fiche ? "Modifier" : "Créer"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
