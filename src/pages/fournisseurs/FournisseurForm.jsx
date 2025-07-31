// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";

export default function FournisseurForm({ fournisseur = {}, onSubmit, onCancel, saving }) {
  const [nom, setNom] = useState(fournisseur.nom || "");
  const [tel, setTel] = useState(fournisseur.contact?.tel || "");
  const [email, setEmail] = useState(fournisseur.contact?.email || "");
  const [contact, setContact] = useState(fournisseur.contact?.nom || "");
  const [actif, setActif] = useState(fournisseur.actif ?? true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setNom(fournisseur.nom || "");
    setTel(fournisseur.contact?.tel || "");
    setEmail(fournisseur.contact?.email || "");
    setContact(fournisseur.contact?.nom || "");
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
    const data = { nom, tel, email, contact, actif };
    try {
      onSubmit?.(data);
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    }
  };

  return (
    <GlassCard title={fournisseur.id ? "Modifier le fournisseur" : "Nouveau fournisseur"}>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">Nom *</label>
        <Input
          className="w-full"
          value={nom}
          onChange={e => setNom(e.target.value)}
        />
        {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
      </div>
      <div>
        <label className="block font-semibold mb-1">Téléphone</label>
        <Input
          type="tel"
          className="w-full"
          value={tel}
          onChange={e => setTel(e.target.value)}
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Contact</label>
        <Input
          className="w-full"
          value={contact}
          onChange={e => setContact(e.target.value)}
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Email</label>
        <Input
          type="email"
          className="w-full"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
        Actif
      </label>
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={saving} className="min-w-[120px]">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </PrimaryButton>
        <SecondaryButton type="button" disabled={saving} onClick={onCancel}>Annuler</SecondaryButton>
      </div>
      </form>
    </GlassCard>
  );
}
