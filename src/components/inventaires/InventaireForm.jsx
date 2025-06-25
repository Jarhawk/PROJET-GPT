import { useState, useEffect } from "react";
import { useInventaires } from "@/hooks/useInventaires";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";

// Ajuste le seuil d’alerte si besoin
const SEUIL_ECART = 0.5; // Unité

export default function InventaireForm({ inventaire, onClose }) {
  const {
    addInventaire,
    editInventaire,
    clotureInventaire,
    fetchMouvementsForPeriod,
    fetchLastClosedInventaire,
  } = useInventaires();
  const { products, fetchProducts } = useProducts();

  const [nom, setNom] = useState(inventaire?.nom || "");
  const [date, setDate] = useState(inventaire?.date || "");
  const [dateDebut, setDateDebut] = useState(inventaire?.date_debut || ""); // Pour la période
  const [lignes, setLignes] = useState(inventaire?.lignes || []);
  const [mouvementsProduits, setMouvementsProduits] = useState([]);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(inventaire?.document || "");
  const [loading, setLoading] = useState(false);

  // Recherche la période d’inventaire automatiquement à partir de l’inventaire précédent
  useEffect(() => {
    async function init() {
      await fetchProducts();
      let date_debut = dateDebut;
      if (!date_debut && inventaire?.date) {
        const prev = await fetchLastClosedInventaire(inventaire.date);
        if (prev?.date) date_debut = prev.date;
      }
      if (!date_debut) {
        const prev = await fetchLastClosedInventaire();
        date_debut = prev?.date || "2024-06-01"; // fallback
      }
      setDateDebut(date_debut);
      if (date) {
        const mouvements = await fetchMouvementsForPeriod(date_debut, date);
        setMouvementsProduits(mouvements);
      }
    }
    init();
  }, [date, inventaire?.date]);

  // Ajout/suppression de lignes
  const addLigne = () => setLignes([...lignes, { product_id: "", quantite: 0 }]);
  const updateLigne = (i, field, val) => {
    setLignes(lignes.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));

  // Calcul consommation/mouvement par produit
  const getConsommationProduit = (product_id, quantite_inventaire) => {
    const mvts = mouvementsProduits.filter(m => m.product_id === product_id);
    const entrees = mvts.filter(m => m.type === "entree").reduce((sum, m) => sum + m.quantite, 0);
    const sorties = mvts.filter(m => m.type === "sortie").reduce((sum, m) => sum + m.quantite, 0);
    // Stock de début : à définir selon la base (dernier inventaire clôturé, ou 0 si pas trouvé)
    const stock_debut = mvts[0]?.stock_debut ?? 0;
    const stock_fin = quantite_inventaire ?? 0;
    const conso_theorique = stock_debut + entrees - sorties - stock_fin;
    return { stock_debut, entrees, sorties, stock_fin, conso_theorique };
  };

  // Upload document vers Supabase Storage
  const handleUpload = async () => {
    if (!file) return toast.error("Sélectionnez un fichier");
    try {
      if (fileUrl) {
        await deleteFile("inventaires", pathFromUrl(fileUrl));
      }
      const url = await uploadFile("inventaires", file);
      setFileUrl(url);
      toast.success("Fichier uploadé !");
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'upload");
    }
  };

  // Clôture (voir version précédente)
  const handleCloture = async () => {
    if (!inventaire?.id) return;
    if (window.confirm("Clôturer cet inventaire ? (action irréversible)")) {
      try {
        setLoading(true);
        await clotureInventaire(inventaire.id);
        toast.success("Inventaire clôturé !");
        onClose?.();
      } catch (err) {
        console.error("Erreur clôture inventaire:", err);
        toast.error("Erreur lors de la clôture.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Submit CRUD
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return toast.error("Nom requis");
    if (!date) return toast.error("Date requise");
    if (lignes.some(l => !l.product_id)) return toast.error("Produit manquant");
    setLoading(true);
    const invData = {
      nom,
      date,
      lignes,
      document: fileUrl || inventaire?.document,
      date_debut: dateDebut,
    };
    try {
      if (inventaire?.id) {
        await editInventaire(inventaire.id, invData);
        toast.success("Inventaire modifié !");
      } else {
        await addInventaire(invData);
        toast.success("Inventaire ajouté !");
      }
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-4">
        {inventaire ? "Modifier l’inventaire" : "Ajouter un inventaire"}
      </h2>
      <input
        className="input mb-2"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom de l’inventaire"
        required
      />
      <input
        className="input mb-2"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      {/* Optionnel : affichage période analysée */}
      <div className="mb-4 text-xs">
        <b>Période d’analyse mouvements :</b> {dateDebut} → {date || "?"}
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Produits inventoriés :</label>
        <table className="min-w-full mb-2 text-xs">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité inventoriée</th>
              <th>Unité</th>
              <th>Stock début</th>
              <th>Entrées</th>
              <th>Sorties</th>
              <th>Stock fin</th>
              <th>Consommation<br/>théorique</th>
              <th>Écart</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => {
              const prod = products.find(p => p.id === l.product_id);
              const {
                stock_debut,
                entrees,
                sorties,
                stock_fin,
                conso_theorique
              } = getConsommationProduit(l.product_id, l.quantite);

              const ecart = -conso_theorique; // Si tu veux comparer à la conso constatée
              return (
                <tr key={i}>
                  <td>
                    <select
                      className="input"
                      value={l.product_id}
                      onChange={e => updateLigne(i, "product_id", e.target.value)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.nom}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={l.quantite}
                      onChange={e => updateLigne(i, "quantite", Number(e.target.value))}
                      required
                    />
                  </td>
                  <td>{prod?.unite || "-"}</td>
                  <td>{stock_debut}</td>
                  <td>{entrees}</td>
                  <td>{sorties}</td>
                  <td>{stock_fin}</td>
                  <td>{conso_theorique.toFixed(2)}</td>
                  <td>
                    {Math.abs(ecart) > SEUIL_ECART ?
                      <span className="text-red-500 font-bold">{ecart.toFixed(2)} ⚠️</span>
                      : <span className="text-green-600">{ecart.toFixed(2)}</span>}
                  </td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => removeLigne(i)}>Suppr.</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Button type="button" size="sm" variant="outline" onClick={addLigne}>Ajouter produit</Button>
      </div>
      <label>
        Document/photo : <input type="file" onChange={e => setFile(e.target.files[0])} />
        <Button type="button" size="sm" variant="outline" className="ml-2" onClick={handleUpload}>Upload</Button>
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 underline"
          >
            Voir
          </a>
        )}
      </label>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{inventaire ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
        {inventaire && !inventaire.cloture &&
          <Button type="button" variant="destructive" onClick={handleCloture}>Clôturer</Button>
        }
      </div>
    </form>
  );
}
