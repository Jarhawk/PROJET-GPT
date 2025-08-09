// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { AnimatePresence, motion as Motion } from "framer-motion";
import toast from "react-hot-toast";

export default function MouvementFormModal({
  open,
  onOpenChange,
  onSubmit,
  produits,
  initial = {},
  loading = false,
  editMode = false,
}) {
  const [form, setForm] = useState({
    produit_id: initial.produit_id || "",
    type: initial.type || "ENTREE",
    sous_type: initial.sous_type || "",
    quantite: initial.quantite || "",
    zone: initial.zone || "",
    motif: initial.motif || "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      produit_id: initial.produit_id || "",
      type: initial.type || "ENTREE",
      sous_type: initial.sous_type || "",
      quantite: initial.quantite || "",
      zone: initial.zone || "",
      motif: initial.motif || "",
    });
    setErrors({});
  }, [initial, open]);

  function validate() {
    const err = {};
    if (!form.produit_id) err.produit_id = "Produit requis";
    if (!form.type) err.type = "Type requis";
    if (!form.quantite || isNaN(form.quantite) || Number(form.quantite) <= 0)
      err.quantite = "Quantité positive requise";
    return err;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length > 0) {
      toast.error("Veuillez corriger les erreurs.");
      return;
    }
    if (submitting) return;
    try {
      setSubmitting(true);
      await onSubmit(form);
      toast.success("Mouvement enregistré !");
      onOpenChange(false);
    } catch (err) {
      console.error("Erreur enregistrement mouvement:", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent asChild>
            <Motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="glass-modal border border-white/40 shadow-[0_8px_32px_0_rgba(50,50,80,0.19),0_1.5px_10px_0_rgba(191,161,77,0.14)] relative overflow-hidden bg-[linear-gradient(120deg,rgba(255,255,255,0.85)_60%,rgba(191,161,77,0.07)_100%)] backdrop-blur-[12px] rounded-[2rem]"
            >
              {/* Effets glass liquid */}
              <span className="absolute -top-12 -left-20 w-60 h-40 bg-mamastockGold/30 blur-3xl rounded-full z-0 opacity-30 animate-pulse" />
              <span className="absolute -bottom-14 -right-20 w-60 h-40 bg-[#0f1c2e]/20 blur-2xl rounded-full z-0 opacity-40 animate-pulse" />

              <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4 p-8 min-w-[330px]">
                <DialogTitle className="text-2xl font-bold text-mamastockGold drop-shadow mb-1 text-center">
                  {editMode ? "Éditer le mouvement" : "Nouveau mouvement"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Formulaire de mouvement de stock
                </DialogDescription>
                {/* Produit */}
                <div>
                  <label className="block font-semibold mb-1">
                    Produit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="produit_id"
                    className={`form-select w-full rounded-xl ${errors.produit_id ? "border-red-400" : ""}`}
                    value={form.produit_id}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner…</option>
                    {produits.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                  {errors.produit_id && <div className="text-red-600 text-xs">{errors.produit_id}</div>}
                </div>
                {/* Type */}
                <div>
                  <label className="block font-semibold mb-1">Type *</label>
                  <select
                    name="type"
                    className={`form-select w-full rounded-xl ${errors.type ? "border-red-400" : ""}`}
                    value={form.type}
                    onChange={handleChange}
                  >
                    <option value="ENTREE">Entrée</option>
                    <option value="SORTIE">Sortie</option>
                  </select>
                  {errors.type && <div className="text-red-600 text-xs">{errors.type}</div>}
                </div>
                {/* Sous-type */}
                <div>
                  <label className="block font-semibold mb-1">Sous-type</label>
                  <input
                    name="sous_type"
                    className="form-input w-full rounded-xl"
                    value={form.sous_type}
                    onChange={handleChange}
                    placeholder="Achat, Perte, Inventaire, etc."
                  />
                </div>
                {/* Quantité */}
                <div>
                  <label className="block font-semibold mb-1">Quantité *</label>
                  <input
                    name="quantite"
                    type="number"
                    min="0"
                    step="any"
                    className={`form-input w-full rounded-xl ${errors.quantite ? "border-red-400" : ""}`}
                    value={form.quantite}
                    onChange={handleChange}
                  />
                  {errors.quantite && <div className="text-red-600 text-xs">{errors.quantite}</div>}
                </div>
                {/* Zone */}
                <div>
                  <label className="block font-semibold mb-1">Zone</label>
                  <input
                    name="zone"
                    className="form-input w-full rounded-xl"
                    value={form.zone}
                    onChange={handleChange}
                    placeholder="(ex: Frigo 1, Cave...)"
                  />
                </div>
                {/* Motif */}
                <div>
                  <label className="block font-semibold mb-1">Motif / justification</label>
                  <textarea
                    name="motif"
                    className="form-textarea w-full rounded-xl"
                    rows={2}
                    value={form.motif}
                    onChange={handleChange}
                  />
                </div>
                <Button
                  type="submit"
                  className={`w-full mt-3 py-2 rounded-xl bg-mamastockGold hover:bg-[#b89730] text-white font-semibold text-lg shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    loading || submitting ? "opacity-70" : ""
                  }`}
                  disabled={loading || submitting}
                >
                  {(loading || submitting) && <span className="loader-glass" />}
                  {loading || submitting ? "Enregistrement…" : (editMode ? "Enregistrer" : "Créer")}
                </Button>
              </form>
              {/* Animation */}
              <style>{`
                .glass-modal { animation: fadeGlass .5s cubic-bezier(.77,0,.18,1) both; }
                @keyframes fadeGlass { from {opacity:0;transform:scale(.93);} to{opacity:1;transform:scale(1);} }
              `}</style>
            </Motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
