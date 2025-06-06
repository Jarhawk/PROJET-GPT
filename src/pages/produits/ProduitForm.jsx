// src/pages/ProduitForm.jsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import AutoCompleteField from "@/components/ui/AutoCompleteField"; // Si tu utilises ce composant optimisé

export default function ProduitForm() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // id si édition
  const isEdit = Boolean(id);

  // États pour le formulaire
  const [form, setForm] = useState({
    nom: "",
    famille: "",
    unite: "",
    quantite_theorique: 0,
    actif: true,
  });
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState([]);
  const [units, setUnits] = useState([]);
  const [error, setError] = useState("");

  // Redirection login si non connecté
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Charger familles/unites optimisé (Promise.all)
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("familles")
        .select("nom")
        .eq("mama_id", claims.mama_id)
        .order("nom"),
      supabase
        .from("unites")
        .select("nom")
        .eq("mama_id", claims.mama_id)
        .order("nom"),
    ]).then(([fam, uni]) => {
      setFamilies(fam.data?.map((f) => f.nom) || []);
      setUnits(uni.data?.map((u) => u.nom) || []);
      setLoading(false);
    });
  }, [claims?.mama_id, isAuthenticated]);

  // Charger produit si édition
  useEffect(() => {
    if (!isEdit || !claims?.mama_id || !isAuthenticated) return;
    setLoading(true);
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("mama_id", claims.mama_id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Produit introuvable ou accès refusé.");
        } else {
          setForm({
            nom: data.nom || "",
            famille: data.famille || "",
            unite: data.unite || "",
            quantite_theorique: data.quantite_theorique ?? 0,
            actif: data.actif ?? true,
          });
        }
        setLoading(false);
      });
  }, [isEdit, id, claims?.mama_id, isAuthenticated]);

  // Gérer changement champ
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "quantite_theorique" ? parseFloat(value) : value,
    }));
  };

  // Gestion soumission form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation rapide
    if (!form.nom || !form.famille || !form.unite) {
      setError("Merci de remplir tous les champs obligatoires.");
      setLoading(false);
      return;
    }

    // Création ou édition
    const payload = {
      ...form,
      mama_id: claims.mama_id,
    };
    let result;
    if (isEdit) {
      result = await supabase
        .from("products")
        .update(payload)
        .eq("id", id)
        .eq("mama_id", claims.mama_id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setError("Erreur lors de la sauvegarde : " + result.error.message);
      setLoading(false);
    } else {
      // Ajouter dynamiquement une nouvelle famille/unité si absente (optimisé)
      if (!families.includes(form.famille)) {
        await supabase
          .from("familles")
          .insert({ nom: form.famille, mama_id: claims.mama_id });
      }
      if (!units.includes(form.unite)) {
        await supabase
          .from("unites")
          .insert({ nom: form.unite, mama_id: claims.mama_id });
      }
      setLoading(false);
      navigate("/produits");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-mamastock-gold animate-pulse">
          Chargement du formulaire...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-mamastock-gold mb-6">
        {isEdit ? "Modifier un produit" : "Créer un nouveau produit"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-xl p-6 flex flex-col gap-4"
      >
        <label className="font-medium text-mamastock-text">
          Nom du produit *
          <input
            className="input input-bordered w-full mt-2"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            required
            autoFocus
          />
        </label>
        <label className="font-medium text-mamastock-text">
          Famille *
          <AutoCompleteField
            value={form.famille}
            onChange={(v) => setForm((prev) => ({ ...prev, famille: v }))}
            options={families}
            placeholder="Sélectionner ou saisir une famille"
            required
          />
        </label>
        <label className="font-medium text-mamastock-text">
          Unité *
          <AutoCompleteField
            value={form.unite}
            onChange={(v) => setForm((prev) => ({ ...prev, unite: v }))}
            options={units}
            placeholder="Sélectionner ou saisir une unité"
            required
          />
        </label>
        <label className="font-medium text-mamastock-text">
          Quantité théorique
          <input
            className="input input-bordered w-full mt-2"
            name="quantite_theorique"
            type="number"
            min={0}
            value={form.quantite_theorique}
            onChange={handleChange}
          />
        </label>
        <label className="inline-flex items-center mt-2 gap-2">
          <input
            type="checkbox"
            name="actif"
            checked={form.actif}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, actif: e.target.checked }))
            }
            className="checkbox"
          />
          Actif
        </label>
        {error && (
          <div className="text-red-600 text-center py-2">{error}</div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/produits")}
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
