// src/pages/ProduitDetail.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function ProduitDetail() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  // Sécurité : redirection login si non auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Charge le produit
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated || !id) return;

    setLoading(true);
    setError("");

    // 1. Détail produit
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("mama_id", claims.mama_id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Produit introuvable ou accès refusé.");
          setProduit(null);
        } else {
          setProduit(data);
        }
        setLoading(false);
      });
  }, [claims?.mama_id, isAuthenticated, id]);

  // Historique achats par fournisseur
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated || !id) return;
    supabase
      .from("purchases")
      .select("id, supplier_id, prix_achat, date_achat, suppliers(nom)")
      .eq("product_id", id)
      .eq("mama_id", claims.mama_id)
      .then(({ data, error }) => {
        if (!error && data) {
          // Grouper par fournisseur
          const grouped = {};
          data.forEach((item) => {
            const sid = item.supplier_id;
            if (!grouped[sid]) grouped[sid] = { supplier: item.suppliers?.nom || "-", achats: [] };
            grouped[sid].achats.push(item);
          });
          // Calcule KPI par fournisseur
          const historyData = Object.entries(grouped).map(([sid, group]) => {
            const achats = group.achats;
            const nb = achats.length;
            const prixMoy = achats.reduce((acc, a) => acc + (a.prix_achat || 0), 0) / nb || 0;
            const dernierAchat = achats.reduce((acc, a) =>
              !acc || new Date(a.date_achat) > new Date(acc.date_achat) ? a : acc, null
            );
            return {
              supplier: group.supplier,
              nb,
              prixMoy,
              dernierAchat: dernierAchat?.date_achat,
              dernierPrix: dernierAchat?.prix_achat,
            };
          });
          setHistory(historyData);
        }
      });
  }, [claims?.mama_id, isAuthenticated, id]);

  // Désactiver ou réactiver produit
  const toggleActif = async () => {
    if (!produit) return;
    setUpdating(true);
    setError("");
    const { error } = await supabase
      .from("products")
      .update({ actif: !produit.actif })
      .eq("id", produit.id)
      .eq("mama_id", claims.mama_id);
    setUpdating(false);
    if (error) {
      setError("Erreur lors de la modification.");
    } else {
      setProduit({ ...produit, actif: !produit.actif });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-mamastock-gold animate-pulse">Chargement du produit...</span>
      </div>
    );
  }

  if (!isAuthenticated || !produit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-red-700">
        {error || "Produit introuvable ou accès refusé."}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-mamastock-gold">
          {produit.nom}
          {!produit.actif && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
              Inactif
            </span>
          )}
        </h1>
        <div className="flex gap-2">
          <button
            className="btn bg-mamastock-gold text-white"
            onClick={() => navigate(`/produits/edit/${produit.id}`)}
          >
            Modifier
          </button>
          <button
            className={`btn ${produit.actif ? "bg-red-500" : "bg-green-600"} text-white`}
            onClick={toggleActif}
            disabled={updating}
          >
            {produit.actif ? "Désactiver" : "Réactiver"}
          </button>
        </div>
      </div>
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <p><strong>Famille :</strong> {produit.famille}</p>
        <p><strong>Unité :</strong> {produit.unite}</p>
        <p><strong>Stock théorique :</strong> {produit.quantite_theorique ?? "-"}</p>
        <p><strong>PMP :</strong> {produit.pmp ? produit.pmp.toFixed(2) + " €" : "-"}</p>
        <p><strong>Dernier prix d'achat :</strong> {produit.dernier_prix ? produit.dernier_prix.toFixed(2) + " €" : "-"}</p>
        <p><strong>Actif :</strong> {produit.actif ? "Oui" : "Non"}</p>
      </div>

      {/* Historique achats */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold text-mamastock-gold mb-4">Historique d’achats par fournisseur</h2>
        <table className="min-w-full table-auto mb-2">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left">Fournisseur</th>
              <th className="px-3 py-2 text-left">Nb achats</th>
              <th className="px-3 py-2 text-left">Prix moyen</th>
              <th className="px-3 py-2 text-left">Dernier prix</th>
              <th className="px-3 py-2 text-left">Dernier achat</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  Aucun achat enregistré pour ce produit.
                </td>
              </tr>
            )}
            {history.map((h, i) => (
              <tr key={i}>
                <td className="px-3 py-2">{h.supplier}</td>
                <td className="px-3 py-2">{h.nb}</td>
                <td className="px-3 py-2">{h.prixMoy ? h.prixMoy.toFixed(2) + " €" : "-"}</td>
                <td className="px-3 py-2">{h.dernierPrix ? h.dernierPrix.toFixed(2) + " €" : "-"}</td>
                <td className="px-3 py-2">{h.dernierAchat ? new Date(h.dernierAchat).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <div className="mt-4 text-red-600 text-center">{error}</div>
      )}
    </div>
  );
}
