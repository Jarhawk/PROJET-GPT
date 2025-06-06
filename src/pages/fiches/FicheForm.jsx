import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useFicheCoutHistory } from "@/hooks/useFicheCoutHistory";

function calcCoutSousRecette(fiche, qteUtilisee) {
  if (!fiche?.cout_total || !fiche?.rendement) return 0;
  return (parseFloat(fiche.cout_total) * (qteUtilisee / fiche.rendement));
}

export default function FicheForm({ initialData = null, onSave, onCancel }) {
  const isEdit = !!initialData;
  const { claims } = useAuth();

  // Pour ajouter historique coût réel à chaque save
  const { addHistory } = useFicheCoutHistory(initialData?.id, claims?.mama_id);

  const [form, setForm] = useState({
    nom: "",
    famille: "",
    unite: "",
    rendement: 1,
    actif: true,
  });
  const [lignes, setLignes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [familles, setFamilles] = useState([]);
  const [unites, setUnites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modale création sous-recette
  const [openSousRecette, setOpenSousRecette] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        nom: initialData.nom || "",
        famille: initialData.famille || "",
        unite: initialData.unite || "",
        rendement: initialData.rendement || 1,
        actif: initialData.actif ?? true,
      });
      setLignes(initialData.lignes || []);
    }
  }, [initialData]);

  // Charger produits et sous-recettes pour autocomplétion
  useEffect(() => {
    const fetchAll = async () => {
      if (!claims?.mama_id) return;
      const [prodRes, ficheRes, famillesRes, unitesRes] = await Promise.all([
        supabase.from("products").select("id, nom, unite, pmp, actif").eq("mama_id", claims.mama_id).eq("actif", true),
        supabase.from("fiches_techniques").select("id, nom, unite, rendement, cout_total, actif").eq("mama_id", claims.mama_id).eq("actif", true),
        supabase.from("familles").select("nom").eq("mama_id", claims.mama_id),
        supabase.from("unites").select("nom").eq("mama_id", claims.mama_id),
      ]);
      setProduits([
        ...(prodRes.data || []).map(p => ({ ...p, type: "produit" })),
        ...(ficheRes.data || []).map(f => ({ ...f, type: "sousrecette", ficheDetail: f })),
      ]);
      setFamilles((famillesRes.data || []).map(f => f.nom));
      setUnites((unitesRes.data || []).map(u => u.nom));
    };
    fetchAll();
  }, [claims?.mama_id, openSousRecette]);

  // Calcul coût total/portion
  const coutTotal = lignes.reduce((acc, l) => acc + (parseFloat(l.cout) || 0), 0);
  const coutPortion = form.rendement ? (coutTotal / form.rendement) : 0;

  // Lignes ingrédients
  const addLigne = (ligne) => setLignes(prev => [...prev, ligne]);
  const removeLigne = (idx) => setLignes(prev => prev.filter((_, i) => i !== idx));
  const updateLigne = (idx, newLigne) => setLignes(prev => prev.map((l, i) => i === idx ? newLigne : l));

  // Ajout ligne produit/sous-recette
  const handleAddLigne = (item) => {
    if (!item) return;
    if (lignes.some(l => l.itemId === item.id && l.type === item.type)) {
      toast.error("Déjà ajouté !");
      return;
    }
    setLignes(prev => [
      ...prev,
      {
        itemId: item.id,
        type: item.type,
        nom: item.nom,
        unite: item.unite || "",
        quantite: 1,
        cout: item.type === "produit" ? (item.pmp || 0) : (item.cout_total || 0),
        ficheDetail: item.ficheDetail || null,
        pmp: item.pmp,
      }
    ]);
  };

  // Mise à jour qté/unité/cout de la ligne
  const handleLigneChange = (idx, key, value) => {
    updateLigne(idx, {
      ...lignes[idx],
      [key]: value,
      cout:
        lignes[idx].type === "produit"
          ? ((key === "quantite" ? value : lignes[idx].quantite) * lignes[idx].pmp)
          : calcCoutSousRecette(
              lignes[idx].ficheDetail,
              key === "quantite" ? value : lignes[idx].quantite
            )
    });
  };

  // Ajout famille/unité à la volée
  const handleAddFamille = async (val) => {
    if (!val || familles.includes(val)) return;
    await supabase.from("familles").insert([{ nom: val, mama_id: claims.mama_id }]);
    setFamilles(prev => [...prev, val]);
  };
  const handleAddUnite = async (val) => {
    if (!val || unites.includes(val)) return;
    await supabase.from("unites").insert([{ nom: val, mama_id: claims.mama_id }]);
    setUnites(prev => [...prev, val]);
  };

  // Création sous-recette rapide
  const handleSousRecetteCreated = (fiche) => {
    setOpenSousRecette(false);
    setProduits(prev => [...prev, { ...fiche, type: "sousrecette", ficheDetail: fiche }]);
    toast.success("Sous-recette ajoutée !");
  };

  // Sauvegarde fiche technique principale
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!form.nom) {
      toast.error("Le nom est obligatoire !");
      setLoading(false);
      return;
    }
    // Format lignes pour BDD
    const lignesToSave = lignes.map(l => ({
      type: l.type,
      item_id: l.itemId,
      nom: l.nom,
      unite: l.unite,
      quantite: l.quantite,
      cout: l.cout,
    }));
    let result;
    if (isEdit) {
      result = await supabase
        .from("fiches_techniques")
        .update({
          ...form,
          cout_total: coutTotal,
          cout_portion: coutPortion,
          lignes: lignesToSave,
        })
        .eq("id", initialData.id)
        .eq("mama_id", claims.mama_id);
    } else {
      result = await supabase
        .from("fiches_techniques")
        .insert([{
          ...form,
          mama_id: claims.mama_id,
          cout_total: coutTotal,
          cout_portion: coutPortion,
          lignes: lignesToSave,
        }]);
    }
    if (result.error) {
      toast.error("Erreur sauvegarde : " + result.error.message);
    } else {
      // Ajout à l'historique coût réel (table dédiée)
      await addHistory({
        cout_total: coutTotal,
        cout_portion: coutPortion,
        updated_by: claims?.user_id
      });
      toast.success(isEdit ? "Fiche modifiée !" : "Fiche créée !");
      if (onSave) onSave();
    }
    setLoading(false);
  };

  return (
    <form
      className="bg-white shadow rounded-xl p-6 flex flex-col gap-4"
      onSubmit={handleSubmit}
    >
      <Toaster />
      <h2 className="text-xl font-bold text-mamastock-gold mb-2">
        {isEdit ? "Modifier la fiche technique" : "Nouvelle fiche technique"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label>
          Nom *
          <input
            className="input input-bordered w-full"
            value={form.nom}
            onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
            required
            autoFocus
          />
        </label>
        <label>
          Famille
          <input
            className="input input-bordered w-full"
            value={form.famille}
            onChange={e => setForm(f => ({ ...f, famille: e.target.value }))}
            list="familles-list"
            onBlur={e => handleAddFamille(e.target.value)}
          />
          <datalist id="familles-list">
            {familles.map(f => <option key={f} value={f} />)}
          </datalist>
        </label>
        <label>
          Unité de rendement
          <input
            className="input input-bordered w-full"
            value={form.unite}
            onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}
            list="unites-list"
            onBlur={e => handleAddUnite(e.target.value)}
          />
          <datalist id="unites-list">
            {unites.map(u => <option key={u} value={u} />)}
          </datalist>
        </label>
        <label>
          Rendement (nombre de portions)
          <input
            type="number"
            min={1}
            className="input input-bordered w-full"
            value={form.rendement}
            onChange={e => setForm(f => ({ ...f, rendement: Number(e.target.value) }))}
            required
          />
        </label>
        <label>
          Statut
          <select
            className="select select-bordered w-full"
            value={form.actif ? "true" : "false"}
            onChange={e => setForm(f => ({ ...f, actif: e.target.value === "true" }))}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-bold text-mamastock-gold mb-2">Ingrédients & Sous-recettes</h3>
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <input
            className="input input-bordered flex-1"
            placeholder="Ajouter ingrédient ou sous-recette..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            list="produits-list"
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                const found = produits.find(
                  p =>
                    p.nom.toLowerCase() === searchValue.toLowerCase() ||
                    p.id === searchValue
                );
                if (found) {
                  handleAddLigne(found);
                  setSearchValue("");
                }
              }
            }}
          />
          <datalist id="produits-list">
            {produits.map(p => (
              <option key={p.id} value={p.nom + (p.type === "sousrecette" ? " (sous-recette)" : "")} />
            ))}
          </datalist>
          <Button type="button" onClick={() => setOpenSousRecette(true)}>
            + Nouvelle sous-recette
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto mb-2">
            <thead>
              <tr>
                <th className="px-2 py-1">Nom</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">Quantité</th>
                <th className="px-2 py-1">Unité</th>
                <th className="px-2 py-1">Coût ligne (€)</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-gray-500">
                    Aucun ingrédient/sous-recette.
                  </td>
                </tr>
              )}
              {lignes.map((l, idx) => (
                <tr key={l.itemId + l.type}>
                  <td className="px-2 py-1">{l.nom}</td>
                  <td className="px-2 py-1">{l.type === "sousrecette" ? "Sous-recette" : "Produit"}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0.01}
                      step="any"
                      className="input input-bordered w-20"
                      value={l.quantite}
                      onChange={e => handleLigneChange(idx, "quantite", parseFloat(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-bordered w-20"
                      value={l.unite}
                      onChange={e => handleLigneChange(idx, "unite", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">{Number(l.cout).toFixed(2)}</td>
                  <td className="px-2 py-1">
                    <Button
                      type="button"
                      variant="destructive"
                      className="btn-xs"
                      onClick={() => removeLigne(idx)}
                    >
                      Suppr
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 justify-end items-center mt-4">
        <div>
          <p><strong>Coût matière total :</strong> {coutTotal.toFixed(2)} €</p>
          <p><strong>Coût matière/portion :</strong> {coutPortion.toFixed(2)} €</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" className="bg-mamastock-gold text-white" disabled={loading}>
            {loading ? "Sauvegarde..." : isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </div>

      {/* MODALE IMBRIQUEE : création rapide sous-recette */}
      <AnimatePresence>
        {openSousRecette && (
          <Dialog open={openSousRecette} onOpenChange={setOpenSousRecette}>
            <DialogOverlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40"
              />
            </DialogOverlay>
            <DialogContent asChild>
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.18, type: "spring" }}
                className="max-w-xl w-full bg-white rounded-xl shadow-2xl relative z-50"
              >
                <DialogHeader>
                  <DialogTitle>Nouvelle sous-recette</DialogTitle>
                  <DialogClose asChild>
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-mamastock-gold"
                      onClick={() => setOpenSousRecette(false)}
                      aria-label="Fermer"
                    >
                      ✕
                    </button>
                  </DialogClose>
                </DialogHeader>
                <SousRecetteForm
                  mama_id={claims?.mama_id}
                  onSave={handleSousRecetteCreated}
                  onCancel={() => setOpenSousRecette(false)}
                />
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </form>
  );
}

// ------ Mini formulaire de sous-recette (imbriqué, code réutilisable) ------
function SousRecetteForm({ mama_id, onSave, onCancel }) {
  const [form, setForm] = useState({
    nom: "",
    unite: "",
    rendement: 1,
    actif: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!form.nom) {
      toast.error("Le nom est obligatoire !");
      setLoading(false);
      return;
    }
    const { error, data } = await supabase.from("fiches_techniques").insert([{ ...form, mama_id }]).select().single();
    if (error) {
      toast.error("Erreur création : " + error.message);
    } else {
      toast.success("Sous-recette créée !");
      if (onSave) onSave(data);
    }
    setLoading(false);
  };

  return (
    <form className="flex flex-col gap-4 p-2" onSubmit={handleSubmit}>
      <label>
        Nom *
        <input
          className="input input-bordered w-full"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          required
        />
      </label>
      <label>
        Unité
        <input
          className="input input-bordered w-full"
          value={form.unite}
          onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}
        />
      </label>
      <label>
        Rendement (nombre de portions)
        <input
          type="number"
          min={1}
          className="input input-bordered w-full"
          value={form.rendement}
          onChange={e => setForm(f => ({ ...f, rendement: Number(e.target.value) }))}
          required
        />
      </label>
      <label>
        Statut
        <select
          className="select select-bordered w-full"
          value={form.actif ? "true" : "false"}
          onChange={e => setForm(f => ({ ...f, actif: e.target.value === "true" }))}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" className="bg-mamastock-gold text-white" disabled={loading}>
          {loading ? "Création..." : "Créer"}
        </Button>
      </div>
    </form>
  );
}
