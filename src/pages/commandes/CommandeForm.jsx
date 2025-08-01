// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useCommandes } from "@/hooks/useCommandes";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import { useFournisseursAutocomplete } from "@/hooks/useFournisseursAutocomplete";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";

export default function CommandeForm({ commande, fournisseurs = [], onClose }) {
  const { insertCommande, updateCommande } = useCommandes();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const { results: fournisseurOptions, searchFournisseurs } = useFournisseursAutocomplete();
  const [date_commande, setDateCommande] = useState(commande?.date_commande || "");
  const [fournisseur_id, setFournisseurId] = useState(commande?.fournisseur_id || "");
  const [fournisseurName, setFournisseurName] = useState("");
  const [statut, setStatut] = useState(commande?.statut || "a_valider");
  const [lignes, setLignes] = useState(
    commande?.lignes?.map(l => ({ ...l, produit_nom: l.produit?.nom || "" })) || [
      { produit_id: "", produit_nom: "", quantite: 1, prix_unitaire: 0, tva: 20 },
    ]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (commande?.fournisseur_id && fournisseurs.length) {
      const f = fournisseurs.find(s => s.id === commande.fournisseur_id);
      setFournisseurName(f?.nom || "");
    }
  }, [commande?.fournisseur_id, fournisseurs]);

  useEffect(() => { searchFournisseurs(fournisseurName); }, [fournisseurName]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!date_commande || !fournisseur_id) return toast.error("Date et fournisseur requis");
    setLoading(true);
    const payload = { date_commande, fournisseur_id, statut, lignes };
    try {
      if (commande?.id) {
        await updateCommande(commande.id, payload);
        toast.success("Commande modifiée");
      } else {
        const { error } = await insertCommande(payload);
        if (error) throw error;
        toast.success("Commande ajoutée");
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
      <GlassCard title={commande ? "Modifier commande" : "Nouvelle commande"} className="p-6 min-w-[400px] space-y-2">
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-sm mb-1">Date de commande *</label>
          <Input
            type="date"
            value={date_commande}
            onChange={e => setDateCommande(e.target.value)}
            required
          />
          <label className="block text-sm mb-1">Fournisseur *</label>
          <Input
            list="fournisseurs-list"
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
          <select
            className="form-select mb-2"
            value={statut}
            onChange={e => setStatut(e.target.value)}
          >
            <option value="a_valider">À valider</option>
            <option value="envoyee">Envoyée</option>
            <option value="receptionnee">Réceptionnée</option>
            <option value="cloturee">Clôturée</option>
          </select>
          <table className="w-full text-sm mb-2">
            <thead><tr><th>Produit</th><th>Qté</th><th>PU</th><th>TVA</th><th></th></tr></thead>
            <tbody>
              {lignes.map((l, idx) => (
                <tr key={idx}>
                  <td className="min-w-[150px]">
                    <AutoCompleteField
                      label=""
                      value={l.produit_id}
                      onChange={obj => {
                        setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, produit_nom: obj?.nom || "", produit_id: obj?.id || "" } : it));
                        if ((obj?.nom || "").length >= 2) searchProduits(obj.nom);
                      }}
                      options={produitOptions.map(p => ({ id: p.id, nom: p.nom }))}
                    />
                  </td>
                  <td><input type="number" className="form-input" value={l.quantite} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, quantite: Number(e.target.value) } : it))} /></td>
                  <td><input type="number" className="form-input" value={l.prix_unitaire} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, prix_unitaire: Number(e.target.value) } : it))} /></td>
                  <td><input type="number" className="form-input" value={l.tva} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, tva: Number(e.target.value) } : it))} /></td>
                  <td><Button type="button" size="sm" variant="outline" onClick={() => setLignes(ls => ls.filter((_,i)=>i!==idx))}>X</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            type="button"
            onClick={() =>
              setLignes(ls => [
                ...ls,
                { produit_id: "", produit_nom: "", quantite: 1, prix_unitaire: 0, tva: 20 },
              ])
            }
            className="mt-2"
          >
            Ajouter ligne
          </Button>
          <div className="flex gap-2 justify-end mt-2">
            <PrimaryButton type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? "Enregistrement..." : commande ? "Modifier" : "Ajouter"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={onClose}>Annuler</SecondaryButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
