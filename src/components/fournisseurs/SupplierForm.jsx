import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function SupplierForm({ supplier, onClose, glass }) {
  const [form, setForm] = useState({
    nom: supplier?.nom || "",
    ville: supplier?.ville || "",
    telephone: supplier?.telephone || "",
    email: supplier?.email || "",
    actif: supplier?.actif ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({
    ...f, [e.target.name]: e.target.value
  }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    if (!form.nom) {
      toast.error("Le nom est obligatoire");
      setLoading(false);
      return;
    }
    let error = null;
    if (supplier) {
      ({ error } = await supabase
        .from("suppliers")
        .update(form)
        .eq("id", supplier.id));
    } else {
      ({ error } = await supabase
        .from("suppliers")
        .insert([{ ...form }]));
    }
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Fournisseur sauvegardé");
      onClose?.();
    }
  };

  return (
    <motion.form
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.98, opacity: 0 }}
      onSubmit={handleSubmit}
      className={`rounded-xl p-6 space-y-4 ${glass ? "bg-white/80 backdrop-blur-xl shadow-2xl border border-mamastockGold" : "bg-white shadow"}`}
      style={{ minWidth: 340 }}
    >
      <h3 className="text-xl font-bold mb-2">{supplier ? "Modifier" : "Ajouter"} un fournisseur</h3>
      <div>
        <label>Nom</label>
        <input className="input input-bordered w-full" name="nom" value={form.nom} onChange={handleChange} required />
      </div>
      <div>
        <label>Ville</label>
        <input className="input input-bordered w-full" name="ville" value={form.ville} onChange={handleChange} />
      </div>
      <div>
        <label>Email</label>
        <input className="input input-bordered w-full" name="email" value={form.email} onChange={handleChange} type="email" />
      </div>
      <div>
        <label>Téléphone</label>
        <input className="input input-bordered w-full" name="telephone" value={form.telephone} onChange={handleChange} />
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
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="submit" loading={loading}>{supplier ? "Enregistrer" : "Ajouter"}</Button>
      </div>
    </motion.form>
  );
}
