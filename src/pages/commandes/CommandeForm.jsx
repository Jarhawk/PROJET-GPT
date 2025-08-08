// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCommandes } from "@/hooks/useCommandes";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { useProduitsFournisseur } from "@/hooks/useProduitsFournisseur";
import useAuth from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

export default function CommandeForm() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { createCommande } = useCommandes();
  const { fournisseurs, fetchFournisseurs } = useFournisseurs();
  const { useProduitsDuFournisseur } = useProduitsFournisseur();
  const [fournisseurId, setFournisseurId] = useState("");
  const { products, fetch } = useProduitsDuFournisseur(fournisseurId);
  const [lignes, setLignes] = useState([
    { produit_id: "", quantite: 1, unite: "", prix_achat: 0, total: 0, suggestion: false, commentaire: "" },
  ]);

  useEffect(() => { fetchFournisseurs({ limit: 1000 }); }, [fetchFournisseurs]);
  useEffect(() => { if (fournisseurId) fetch(); }, [fournisseurId, fetch]);

  const handleChangeLine = (idx, field, value) => {
    const updated = [...lignes];
    updated[idx][field] = value;
    if (field === "quantite" || field === "prix_achat") {
      updated[idx].total = Number(updated[idx].quantite || 0) * Number(updated[idx].prix_achat || 0);
    }
    setLignes(updated);
  };

  const addLine = () => setLignes([...lignes, { produit_id: "", quantite: 1, unite: "", prix_achat: 0, total: 0, suggestion: false, commentaire: "" }]);

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      fournisseur_id: fournisseurId,
      lignes: lignes.map(l => ({
        produit_id: l.produit_id,
        quantite: Number(l.quantite),
        unite: l.unite,
        prix_achat: Number(l.prix_achat),
        total_ligne: l.total,
        suggestion: l.suggestion,
        commentaire: l.commentaire,
      })),
    };
    const { error } = await createCommande(payload);
    if (error) toast.error("Erreur création");
    else {
      toast.success("Commande créée");
      navigate("/commandes");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block" htmlFor="fournisseur">Fournisseur</label>
        <select
          id="fournisseur"
          aria-label="Fournisseur"
          className="input"
          value={fournisseurId}
          onChange={e => setFournisseurId(e.target.value)}
        >
          <option value="">--</option>
          {fournisseurs.map(f => (
            <option key={f.id} value={f.id}>{f.nom}</option>
          ))}
        </select>
      </div>
      {lignes.map((l, idx) => (
        <div key={idx} className="border border-white/10 rounded p-2 space-y-2">
          <div>
            <label>Produit</label>
            <select
              aria-label="Produit"
              className="input"
              value={l.produit_id}
              onChange={e => handleChangeLine(idx, "produit_id", e.target.value)}
            >
              <option value="">--</option>
              {products.map(p => (
                <option key={p.produit.id} value={p.produit.id}>{p.produit.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Quantité</label>
            <input
              type="number"
              aria-label="Quantité"
              className="input"
              value={l.quantite}
              onChange={e => handleChangeLine(idx, "quantite", e.target.value)}
            />
          </div>
          <div>
            <label>Unité</label>
            <input
              aria-label="Unité"
              className="input"
              value={l.unite}
              onChange={e => handleChangeLine(idx, "unite", e.target.value)}
            />
          </div>
          <div>
            <label>Prix d’achat</label>
            <input
              type="number"
              aria-label="Prix d’achat"
              className="input"
              value={l.prix_achat}
              onChange={e => handleChangeLine(idx, "prix_achat", e.target.value)}
            />
          </div>
          <div>
            <label>Total ligne</label>
            <input type="number" aria-label="Total ligne" className="input" value={l.total} readOnly />
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={l.suggestion}
                onChange={e => handleChangeLine(idx, "suggestion", e.target.checked)}
              />{' '}Suggestion
            </label>
          </div>
          <div>
            <label>Commentaire</label>
            <input
              aria-label="Commentaire"
              className="input"
              value={l.commentaire}
              onChange={e => handleChangeLine(idx, "commentaire", e.target.value)}
            />
          </div>
        </div>
      ))}
      <button type="button" onClick={addLine}>Ajouter ligne</button>
      {role === 'admin' && <button type="submit">Valider commande</button>}
    </form>
  );
}
