import { useState, useEffect } from "react";
import { useFiches } from "@/hooks/useFiches";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";

export default function FicheForm({ fiche, onClose }) {
  const { addFiche, editFiche } = useFiches();
  const { products, fetchProducts } = useProducts();
  const [nom, setNom] = useState(fiche?.nom || "");
  const [description, setDescription] = useState(fiche?.description || "");
  const [portions, setPortions] = useState(fiche?.portions || 1);
  const [lignes, setLignes] = useState(fiche?.lignes || []);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(fiche?.image || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  // Ajouter une ligne produit
  const addLigne = () => setLignes([...lignes, { product_id: "", quantite: 1 }]);
  // Modifier ligne
  const updateLigne = (i, field, val) => {
    setLignes(lignes.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };
  // Supprimer ligne
  const removeLigne = (i) => setLignes(lignes.filter((_, idx) => idx !== i));

  // Calcul coût total
  const cout_total = lignes.reduce((sum, l) => {
    const prod = products.find(p => p.id === l.product_id);
    return sum + (prod && prod.pmp ? Number(l.quantite) * Number(prod.pmp) : 0);
  }, 0);
  const cout_par_portion = portions > 0 ? cout_total / portions : 0;

  // Upload image vers Supabase Storage
  const handleUpload = async () => {
    if (!image) return toast.error("Sélectionnez une image");
    try {
      if (imageUrl) {
        await deleteFile("fiches", pathFromUrl(imageUrl));
      }
      const url = await uploadFile("fiches", image);
      setImageUrl(url);
      toast.success("Image uploadée !");
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'upload");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ficheData = {
      nom,
      description,
      portions,
      lignes,
      cout_total,
      cout_par_portion,
      image: imageUrl || fiche?.image
    };
    try {
      if (fiche?.id) {
        await editFiche(fiche.id, ficheData);
        toast.success("Fiche modifiée !");
      } else {
        await addFiche(ficheData);
        toast.success("Fiche ajoutée !");
      }
      onClose?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-4">
        {fiche ? "Modifier la fiche technique" : "Ajouter une fiche technique"}
      </h2>
      <input
        className="input mb-2"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom de la fiche"
        required
      />
      <textarea
        className="input mb-2"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description / étapes"
      />
      <input
        className="input mb-2"
        type="number"
        min={1}
        value={portions}
        onChange={e => setPortions(Number(e.target.value))}
        placeholder="Nombre de portions"
        required
      />
      {/* Gestion dynamique des lignes produits */}
      <div className="mb-4">
        <label className="block font-semibold mb-2">Ingrédients :</label>
        <table className="min-w-full mb-2">
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
                  <td>{prod?.pmp?.toFixed(2) || "-"}</td>
                  <td>{prod && prod.pmp ? (prod.pmp * l.quantite).toFixed(2) : "-"}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => removeLigne(i)}>Suppr.</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Button type="button" size="sm" variant="outline" onClick={addLigne}>Ajouter ingrédient</Button>
      </div>
      <div className="mb-4 flex gap-4">
        <div><b>Coût total :</b> {cout_total.toFixed(2)} €</div>
        <div><b>Coût/portion :</b> {cout_par_portion.toFixed(2)} €</div>
      </div>
      <label>
        Image fiche : <input type="file" onChange={e => setImage(e.target.files[0])} />
        <Button type="button" size="sm" variant="outline" className="ml-2" onClick={handleUpload}>Upload</Button>
        {imageUrl && (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 underline"
          >
            Voir
          </a>
        )}
      </label>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{fiche ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
