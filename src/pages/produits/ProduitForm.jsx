import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// Champ autocomplétion (famille/unité) – propose tout, ajoute si absent
function AutoCompleteInput({ value, onChange, options, placeholder }) {
  return (
    <>
      <input
        className="input mb-2"
        list={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder.charAt(0).toUpperCase() + placeholder.slice(1)}
        required
        autoComplete="off"
      />
      <datalist id={placeholder}>
        {options.map((opt, idx) => <option key={idx} value={opt} />)}
      </datalist>
    </>
  );
}

export default function ProduitForm({ produit, familles, unites, onClose }) {
  const { addProduct, editProduct } = useProducts();

  const [nom, setNom] = useState(produit?.nom || "");
  const [famille, setFamille] = useState(produit?.famille || "");
  const [unite, setUnite] = useState(produit?.unite || "");
  const [stock, setStock] = useState(produit?.stock || 0);
  const [actif, setActif] = useState(produit?.actif ?? true);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Upload image (mock, à brancher storage)
  const handleUpload = () => {
    if (image) toast.success("Upload image (mock)");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newProduct = {
      nom,
      famille,
      unite,
      stock,
      actif,
      image: image ? "TODO-upload" : produit?.image,
    };
    try {
      if (produit?.id) {
        await editProduct(produit.id, newProduct);
        toast.success("Produit modifié !");
      } else {
        await addProduct(newProduct);
        toast.success("Produit ajouté !");
      }
      onClose?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">
        {produit ? "Modifier le produit" : "Ajouter un produit"}
      </h2>
      <input
        className="input mb-2"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom"
        required
      />
      <AutoCompleteInput value={famille} onChange={setFamille} options={familles.map(f => f.nom)} placeholder="famille" />
      <AutoCompleteInput value={unite} onChange={setUnite} options={unites.map(u => u.nom)} placeholder="unite" />
      <input
        className="input mb-2"
        type="number"
        value={stock}
        onChange={e => setStock(Number(e.target.value))}
        placeholder="Stock"
      />
      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
        Actif
      </label>
      <label>
        Image : <input type="file" onChange={e => setImage(e.target.files[0])} />
        <Button type="button" variant="outline" size="sm" onClick={handleUpload} className="ml-2">Upload</Button>
      </label>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{produit ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
