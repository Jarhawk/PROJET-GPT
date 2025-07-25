// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { motion as Motion } from "framer-motion";

export default function FournisseurFormModal({ fournisseur, onClose, glass }) { // ✅ Correction Codex
  const { createFournisseur, updateFournisseur } = useFournisseurs();
  const [form, setForm] = useState({ // ✅ Correction Codex
    nom: fournisseur?.nom || "", // ✅ Correction Codex
    tel: fournisseur?.contact?.tel || "", // ✅ Correction Codex
    contact: fournisseur?.contact?.nom || "", // ✅ Correction Codex
    email: fournisseur?.contact?.email || "", // ✅ Correction Codex
    actif: fournisseur?.actif ?? true, // ✅ Correction Codex
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({
    ...f, [e.target.name]: e.target.value
  }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    if (!form.nom) {
      toast.error("Le nom est obligatoire");
      setLoading(false);
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Email invalide");
      setLoading(false);
      return;
    }
    try {
      let res; // ✅ Correction Codex
      if (fournisseur) { // ✅ Correction Codex
        res = await updateFournisseur(fournisseur.id, form); // ✅ Correction Codex
      } else {
        res = await createFournisseur(form); // ✅ Correction Codex
      }
      if (res?.error) throw res.error;
      toast.success("Fournisseur sauvegardé");
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Erreur enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.form
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.98, opacity: 0 }}
      onSubmit={handleSubmit}
      className={`rounded-xl p-6 space-y-4 ${glass ? "bg-white/80 backdrop-blur-xl shadow-2xl border border-mamastockGold" : "bg-white shadow"} min-w-[340px]`}
   >
      <h3 className="text-xl font-bold mb-2">{fournisseur ? "Modifier" : "Ajouter"} un fournisseur</h3> // ✅ Correction Codex
      <div>
        <label>Nom</label>
        <input className="input input-bordered w-full" name="nom" value={form.nom} onChange={handleChange} required />
      </div>
      <div>
        <label>Email</label>
        <input className="input input-bordered w-full" name="email" value={form.email} onChange={handleChange} type="email" />
      </div>
      <div>
        <label>Téléphone</label>
        <input className="input input-bordered w-full" name="tel" type="tel" value={form.tel} onChange={handleChange} />
      </div>
      <div>
        <label>Contact</label>
        <input className="input input-bordered w-full" name="contact" value={form.contact} onChange={handleChange} />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))}
          />
          Actif
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>{fournisseur ? "Enregistrer" : "Ajouter"}</Button> // ✅ Correction Codex
      </div>
    </Motion.form>
  );
}
