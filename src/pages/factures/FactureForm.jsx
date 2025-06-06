import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";

export default function FactureForm() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    numero: "",
    date_facture: "",
    supplier_id: "",
    montant: 0,
    commentaire: "",
    statut: "en_attente",
  });
  const [prevStatut, setPrevStatut] = useState("en_attente");
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [lignesAvantEdition, setLignesAvantEdition] = useState([]);
  const [lastPrices, setLastPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  // Charge fournisseurs, produits, derniers prix connus
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("suppliers")
        .select("id, nom")
        .eq("mama_id", claims.mama_id)
        .eq("actif", true)
        .order("nom"),
      supabase
        .from("products")
        .select("id, nom, unite, dernier_prix")
        .eq("mama_id", claims.mama_id)
        .eq("actif", true)
        .order("famille"),
    ]).then(([fournRes, prodRes]) => {
      setFournisseurs(fournRes.data || []);
      setProduits(prodRes.data || []);
      setLastPrices(
        Object.fromEntries((prodRes.data || []).map(p => [p.id, p.dernier_prix]))
      );
      setLoading(false);
    });
  }, [claims?.mama_id, isAuthenticated]);

  // Charge facture et lignes si édition
  useEffect(() => {
    if (!isEdit || !claims?.mama_id || !isAuthenticated) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .eq("mama_id", claims.mama_id)
        .single(),
      supabase
        .from("invoice_lines")
        .select("*")
        .eq("invoice_id", id)
        .eq("mama_id", claims.mama_id),
    ]).then(([factureRes, lignesRes]) => {
      if (factureRes.error || !factureRes.data) {
        setError("Facture introuvable ou accès refusé.");
      } else {
        setForm({
          numero: factureRes.data.numero || "",
          date_facture: factureRes.data.date_facture
            ? factureRes.data.date_facture.slice(0, 10)
            : "",
          supplier_id: factureRes.data.supplier_id || "",
          montant: factureRes.data.montant ?? 0,
          commentaire: factureRes.data.commentaire || "",
          statut: factureRes.data.statut || "en_attente",
        });
        setPrevStatut(factureRes.data.statut || "en_attente");
      }
      setLignes(
        (lignesRes.data || []).map((l) => ({
          ...l,
          quantite: parseFloat(l.quantite),
          prix_unitaire: parseFloat(l.prix_unitaire),
          total: parseFloat(l.total),
          tva: l.tva ?? 20,
        }))
      );
      setLignesAvantEdition(lignesRes.data || []);
      setLoading(false);
    });
  }, [isEdit, id, claims?.mama_id, isAuthenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "montant" ? parseFloat(value) : value,
    }));
  };

  const addLigne = () =>
    setLignes((prev) => [
      ...prev,
      { product_id: "", quantite: 1, prix_unitaire: 0, tva: 20, total: 0 },
    ]);

  const updateLigne = (idx, champ, valeur) => {
    setLignes((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        // Contrôle prix incohérent
        let newLigne = { ...l, [champ]: champ === "quantite" || champ === "prix_unitaire" || champ === "tva" ? parseFloat(valeur) : valeur };
        if (champ === "prix_unitaire") {
          const pId = l.product_id;
          const last = lastPrices[pId];
          if (last && Math.abs((valeur - last) / last) > 0.1) {
            toast(
              `Le prix saisi (${valeur} €) diffère de plus de 10 % du dernier prix enregistré (${last} €) !`,
              { icon: "⚠️" }
            );
          }
        }
        // Mise à jour total
        newLigne.total = (newLigne.quantite || 0) * (newLigne.prix_unitaire || 0);
        return newLigne;
      })
    );
  };

  const removeLigne = (idx) =>
    setLignes((prev) => prev.filter((_, i) => i !== idx));

  // Calculs totaux
  const totalHT = lignes.reduce((acc, l) => acc + (l.quantite * l.prix_unitaire), 0);
  const totalTVA = lignes.reduce((acc, l) => acc + (l.quantite * l.prix_unitaire * (parseFloat(l.tva || 20) / 100)), 0);
  const totalTTC = totalHT + totalTVA;

  useEffect(() => {
    setForm((prev) => ({ ...prev, montant: totalTTC }));
  }, [totalTTC]);

  // Soumission form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      !form.numero ||
      !form.date_facture ||
      !form.supplier_id ||
      !form.montant ||
      lignes.length === 0 ||
      lignes.some((l) => !l.product_id || l.quantite <= 0 || l.prix_unitaire < 0)
    ) {
      setError("Tous les champs et lignes doivent être valides.");
      setLoading(false);
      return;
    }

    // 1. GESTION STOCK : rollback des anciennes lignes si édition
    if (isEdit) {
      for (const oldLigne of lignesAvantEdition) {
        await supabase.rpc("update_stock", {
          product_id: oldLigne.product_id,
          quantite_delta: -oldLigne.quantite,
          mama_id: claims.mama_id,
        });
      }
    }

    // 2. GESTION STOCK : rollback si statut rejeté
    if (form.statut === "rejetée") {
      for (const l of lignes) {
        await supabase.rpc("update_stock", {
          product_id: l.product_id,
          quantite_delta: -l.quantite,
          mama_id: claims.mama_id,
        });
      }
    }

    // 3. Sauvegarde en base
    const payload = {
      ...form,
      mama_id: claims.mama_id,
    };
    let result;
    if (isEdit) {
      result = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", id)
        .eq("mama_id", claims.mama_id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("invoices")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      toast.error("Erreur lors de la sauvegarde : " + result.error.message);
      setLoading(false);
      return;
    }

    // 4. Sauvegarde des lignes
    const invoice_id = isEdit ? id : result.data.id;
    if (isEdit) {
      await supabase
        .from("invoice_lines")
        .delete()
        .eq("invoice_id", invoice_id)
        .eq("mama_id", claims.mama_id);
    }
    const lignesToInsert = lignes
      .filter((l) => l.product_id && l.quantite > 0)
      .map((l) => ({
        ...l,
        total: l.quantite * l.prix_unitaire,
        invoice_id,
        mama_id: claims.mama_id,
      }));
    if (lignesToInsert.length) {
      await supabase.from("invoice_lines").insert(lignesToInsert);
    }

    // 5. GESTION STOCK : application des nouvelles lignes (sauf si rejetée)
    if (form.statut !== "rejetée") {
      for (const l of lignes) {
        await supabase.rpc("update_stock", {
          product_id: l.product_id,
          quantite_delta: l.quantite,
          mama_id: claims.mama_id,
        });
      }
    }

    toast.success(
      isEdit
        ? "Facture modifiée et stocks ajustés !"
        : "Facture créée et stocks mis à jour !"
    );
    setLoading(false);
    navigate("/factures");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-6">
        {isEdit ? "Modifier une facture" : "Créer une nouvelle facture"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-xl p-6 flex flex-col gap-4"
      >
        <label className="font-medium text-mamastock-text">
          N° Facture *
          <input
            className="input input-bordered w-full mt-2"
            name="numero"
            value={form.numero}
            onChange={handleChange}
            required
            autoFocus
          />
        </label>
        <label className="font-medium text-mamastock-text">
          Date facture *
          <input
            className="input input-bordered w-full mt-2"
            name="date_facture"
            type="date"
            value={form.date_facture}
            onChange={handleChange}
            required
          />
        </label>
        <label className="font-medium text-mamastock-text">
          Fournisseur *
          <select
            className="select select-bordered w-full mt-2"
            name="supplier_id"
            value={form.supplier_id}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </label>
        <label className="font-medium text-mamastock-text">
          Statut *
          <select
            className="select select-bordered w-full mt-2"
            name="statut"
            value={form.statut}
            onChange={handleChange}
            required
          >
            <option value="en_attente">En attente</option>
            <option value="validée">Validée</option>
            <option value="rejetée">Rejetée</option>
          </select>
        </label>
        <label className="font-medium text-mamastock-text">
          Commentaire
          <input
            className="input input-bordered w-full mt-2"
            name="commentaire"
            value={form.commentaire}
            onChange={handleChange}
            maxLength={255}
          />
        </label>

        {/* Lignes de facture */}
        <div className="bg-gray-50 border rounded-xl p-4 mb-4 overflow-x-auto">
          <h2 className="font-bold text-mamastock-gold mb-2">Lignes de la facture</h2>
          <table className="min-w-full table-auto mb-2">
            <thead>
              <tr>
                <th className="px-3 py-2">Produit</th>
                <th className="px-3 py-2">Quantité</th>
                <th className="px-3 py-2">PU (€)</th>
                <th className="px-3 py-2">TVA (%)</th>
                <th className="px-3 py-2">HT (€)</th>
                <th className="px-3 py-2">TVA (€)</th>
                <th className="px-3 py-2">TTC (€)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-gray-500">
                    Aucune ligne.
                    <button
                      className="btn ml-2"
                      type="button"
                      onClick={addLigne}
                    >
                      + Ajouter une ligne
                    </button>
                  </td>
                </tr>
              )}
              {lignes.map((l, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2">
                    <select
                      className="select select-bordered"
                      value={l.product_id}
                      onChange={e => updateLigne(idx, "product_id", e.target.value)}
                    >
                      <option value="">Sélectionner</option>
                      {produits.map((p) => (
                        <option key={p.id} value={p.id}>{p.nom} ({p.unite})</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="input input-bordered w-20"
                      min={0.01}
                      step="0.01"
                      value={l.quantite}
                      onChange={e => updateLigne(idx, "quantite", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="input input-bordered w-24"
                      min={0}
                      step="0.01"
                      value={l.prix_unitaire}
                      onChange={e => updateLigne(idx, "prix_unitaire", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="input input-bordered w-16"
                      min={0}
                      max={100}
                      value={l.tva ?? 20}
                      onChange={e => updateLigne(idx, "tva", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {(l.quantite * l.prix_unitaire).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {((l.quantite * l.prix_unitaire) * (parseFloat(l.tva || 20) / 100)).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {(l.quantite * l.prix_unitaire * (1 + (parseFloat(l.tva || 20) / 100))).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="btn btn-xs bg-red-500 text-white"
                      type="button"
                      onClick={() => removeLigne(idx)}
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {lignes.length > 0 && (
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={4}>Totaux</td>
                  <td>{totalHT.toFixed(2)}</td>
                  <td>{totalTVA.toFixed(2)}</td>
                  <td>{totalTTC.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
          {lignes.length > 0 && (
            <button className="btn" type="button" onClick={addLigne}>
              + Ajouter une ligne
            </button>
          )}
        </div>
        <div className="text-right font-bold text-lg mt-4">
          Total TTC : {totalTTC.toFixed(2)} €
        </div>
        {error && (
          <div className="text-red-600 text-center py-2">{error}</div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/factures")}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn bg-mamastock-gold text-white"
            disabled={loading}
          >
            {loading ? "Sauvegarde..." : isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
