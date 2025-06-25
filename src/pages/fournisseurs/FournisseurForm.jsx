import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function FournisseurForm({ fournisseur = {}, onSubmit, onCancel, saving }) {
  const [nom, setNom] = useState(fournisseur.nom || "");
  const [ville, setVille] = useState(fournisseur.ville || "");
  const [telephone, setTelephone] = useState(fournisseur.telephone || "");
  const [email, setEmail] = useState(fournisseur.email || "");
  const [actif, setActif] = useState(fournisseur.actif ?? true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setNom(fournisseur.nom || "");
    setVille(fournisseur.ville || "");
    setTelephone(fournisseur.telephone || "");
    setEmail(fournisseur.email || "");
    setActif(fournisseur.actif ?? true);
    setErrors({});
  }, [fournisseur]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;
    const errs = {};
    if (!nom.trim()) errs.nom = "Nom requis";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email invalide";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Veuillez corriger les erreurs");
      return;
    }
    const data = { nom, ville, telephone, email, actif };
    try {
      onSubmit?.(data);
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">Nom *</label>
        <input
          className="input input-bordered w-full"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
      </div>
      <div>
        <label className="block font-semibold mb-1">Ville</label>
        <input
          className="input input-bordered w-full"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Téléphone</label>
        <input
          className="input input-bordered w-full"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Email</label>
        <input
          className="input input-bordered w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
        Actif
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>Enregistrer</Button>
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}
