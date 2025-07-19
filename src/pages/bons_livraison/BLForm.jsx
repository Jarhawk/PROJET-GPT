// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useBonsLivraison } from "@/hooks/useBonsLivraison";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import { useFournisseursAutocomplete } from "@/hooks/useFournisseursAutocomplete";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";

export default function BLForm({ bon, fournisseurs = [], onClose }) {
  const { insertBonLivraison, updateBonLivraison } = useBonsLivraison();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const { results: fournisseurOptions, searchFournisseurs } = useFournisseursAutocomplete();
  const [date_reception, setDateReception] = useState(bon?.date_reception || "");
  const [fournisseur_id, setFournisseurId] = useState(bon?.fournisseur_id || "");
  const [fournisseurName, setFournisseurName] = useState("");
  const [numero_bl, setNumero] = useState(bon?.numero_bl || "");
  const [commentaire, setCommentaire] = useState(bon?.commentaire || "");
  const [lignes, setLignes] = useState(
    bon?.lignes?.map(l => ({ ...l, produit_nom: l.produit?.nom || "" })) || [
      { produit_id: "", produit_nom: "", quantite_recue: 1, prix_unitaire: 0, tva: 20 },
    ]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bon?.fournisseur_id && fournisseurs.length) {
      const f = fournisseurs.find(s => s.id === bon.fournisseur_id);
      setFournisseurName(f?.nom || "");
    }
  }, [bon?.fournisseur_id, fournisseurs]);

  useEffect(() => { searchFournisseurs(fournisseurName); }, [fournisseurName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date_reception || !fournisseur_id) return toast.error("Date et fournisseur requis");
    setLoading(true);
    const payload = { numero_bl, date_reception, fournisseur_id, commentaire, lignes };
    try {
      if (bon?.id) {
        await updateBonLivraison(bon.id, payload);
        toast.success("BL modifié");
      } else {
        const { error } = await insertBonLivraison(payload);
        if (error) throw error;
        toast.success("BL ajouté");
      }
      onClose?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <GlassCard className="p-6 min-w-[400px] space-y-2">
        <h2 className="text-lg font-bold mb-2">{bon ? "Modifier" : "Nouveau"} BL</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input type="text" className="input" placeholder="Numéro" value={numero_bl} onChange={e => setNumero(e.target.value)} />
          <input type="date" className="input" value={date_reception} onChange={e => setDateReception(e.target.value)} required />
          <input
            list="fournisseurs-list"
            className="input"
            value={fournisseurName}
            onChange={e => {
              const val = e.target.value;
              setFournisseurName(val);
              const found = fournisseurOptions.find(f => f.nom === val);
              setFournisseurId(found ? found.id : "");
            }}
            placeholder="Fournisseur"
            required
          />
          <datalist id="fournisseurs-list">
            {fournisseurOptions.map(f => (
              <option key={f.id} value={f.nom}>{f.nom}</option>
            ))}
          </datalist>
          <textarea className="input" placeholder="Commentaire" value={commentaire} onChange={e => setCommentaire(e.target.value)} />
          <table className="w-full text-sm mb-2">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
                <th>PU</th>
                <th>TVA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, idx) => (
                <tr key={idx}>
                  <td className="min-w-[150px]">
                    <AutoCompleteField
                      label=""
                      value={l.produit_nom}
                      onChange={val => {
                        setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, produit_nom: val, produit_id: produitOptions.find(p => p.nom === val)?.id || "" } : it));
                        if (val.length >= 2) searchProduits(val);
                      }}
                      options={produitOptions.map(p => p.nom)}
                    />
                  </td>
                  <td><input type="number" className="input" value={l.quantite_recue} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, quantite_recue: Number(e.target.value) } : it))} /></td>
                  <td><input type="number" className="input" value={l.prix_unitaire} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, prix_unitaire: Number(e.target.value) } : it))} /></td>
                  <td><input type="number" className="input" value={l.tva} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, tva: Number(e.target.value) } : it))} /></td>
                  <td><Button type="button" size="sm" variant="outline" onClick={() => setLignes(ls => ls.filter((_,i)=>i!==idx))}>X</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button type="button" variant="outline" onClick={() => setLignes(ls => [...ls, { produit_id: "", produit_nom: "", quantite_recue: 1, prix_unitaire: 0, tva: 20 }])}>Ajouter ligne</Button>
          <div className="flex gap-2 justify-end mt-2">
            <Button type="submit" disabled={loading}>{bon ? "Modifier" : "Ajouter"}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
