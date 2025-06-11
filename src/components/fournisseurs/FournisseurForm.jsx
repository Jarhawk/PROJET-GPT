import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import toast from "react-hot-toast";

export default function FournisseurForm({ fournisseur, onSuccess }) {
  const { mama_id } = useAuth();
  const { addFournisseur, editFournisseur } = useFournisseurs(mama_id);

  const [nom, setNom] = useState(fournisseur?.nom || "");
  const [ville, setVille] = useState(fournisseur?.ville || "");
  const [email, setEmail] = useState(fournisseur?.email || "");
  const [actif, setActif] = useState(fournisseur?.actif ?? true);
  const [logo, setLogo] = useState(null); // fichier logo
  const [loading, setLoading] = useState(false);

  // Historique mock
  const historique = fournisseur?.historique || [
    { date: "2024-05-01", facture: "F123", montant: 250.12 },
    { date: "2024-04-01", facture: "F120", montant: 163.21 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { nom, ville, email, actif, mama_id, logo: logo ? "TODO-upload" : fournisseur?.logo };
      if (fournisseur?.id) {
        await editFournisseur(fournisseur.id, data);
        toast.success("Fournisseur modifié !");
      } else {
        await addFournisseur(data);
        toast.success("Fournisseur ajouté !");
      }
      onSuccess?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
      <h2 className="font-bold text-xl mb-4">
        {fournisseur?.id ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
      </h2>
      <input
        type="text"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom du fournisseur"
        className="input mb-2"
        required
      />
      <input
        type="text"
        value={ville}
        onChange={e => setVille(e.target.value)}
        placeholder="Ville"
        className="input mb-2"
      />
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        className="input mb-2"
      />
      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
        Actif
      </label>
      <label className="mb-2 block">
        Logo : <input type="file" onChange={e => setLogo(e.target.files[0])} />
      </label>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {fournisseur?.id ? "Modifier" : "Ajouter"}
      </button>
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Historique des commandes :</h3>
        <ul>
          {historique.map((h, i) => (
            <li key={i} className="text-sm">
              {h.date} — Facture {h.facture} — {h.montant.toFixed(2)} €
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
