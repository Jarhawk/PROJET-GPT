// src/pages/Produits.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 50;

export default function Produits() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();

  // Gestion état UI
  const [produits, setProduits] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [familleFilter, setFamilleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actifFilter, setActifFilter] = useState("true"); // "true", "false", "all"
  const [familles, setFamilles] = useState([]);

  // Sécurité : redirection login si non auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Charge les familles pour le filtre
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated) return;
    async function fetchFamilles() {
      const { data } = await supabase
        .from("familles")
        .select("nom")
        .eq("mama_id", claims.mama_id);
      setFamilles(data?.map((f) => f.nom) || []);
    }
    fetchFamilles();
  }, [claims?.mama_id, isAuthenticated]);

  // Charge les produits paginés
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated) return;

    setLoading(true);

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("mama_id", claims.mama_id);

    // Filtres
    if (actifFilter !== "all") {
      query = query.eq("actif", actifFilter === "true");
    }
    if (familleFilter) {
      query = query.ilike("famille", familleFilter);
    }
    if (search) {
      query = query.or(
        `nom.ilike.%${search}%,famille.ilike.%${search}%,unite.ilike.%${search}%`
      );
    }

    query = query.order("famille", { ascending: true })
                 .order("nom", { ascending: true })
                 .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    query.then(({ data, count, error }) => {
      if (error) {
        setProduits([]);
        setTotal(0);
      } else {
        setProduits(data || []);
        setTotal(count || 0);
      }
      setLoading(false);
    });
  }, [claims?.mama_id, isAuthenticated, page, familleFilter, actifFilter, search]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-mamastock-gold animate-pulse">Chargement des produits...</span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Pagination
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-mamastock-gold mb-6">
        Produits
      </h1>
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        <input
          className="input input-bordered"
          type="text"
          placeholder="Recherche nom, famille, unité..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="select select-bordered"
          value={familleFilter}
          onChange={(e) => {
            setFamilleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toutes familles</option>
          {familles.map((fam) => (
            <option key={fam} value={fam}>
              {fam}
            </option>
          ))}
        </select>
        <select
          className="select select-bordered"
          value={actifFilter}
          onChange={(e) => {
            setActifFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
          <option value="all">Tous</option>
        </select>
        <button
          className="btn bg-mamastock-gold text-white"
          onClick={() => navigate("/produits/nouveau")}
        >
          + Nouveau produit
        </button>
      </div>
      {/* Table produits */}
      <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-mamastock-bg text-mamastock-gold">
              <th className="py-2 px-3 text-left">Nom</th>
              <th className="py-2 px-3 text-left">Famille</th>
              <th className="py-2 px-3 text-left">Unité</th>
              <th className="py-2 px-3 text-left">Stock théorique</th>
              <th className="py-2 px-3 text-left">PMP</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {produits.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Aucun produit trouvé
                </td>
              </tr>
            )}
            {produits.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-mamastock-bg/10 cursor-pointer"
                onClick={() => navigate(`/produits/${p.id}`)}
              >
                <td className="py-2 px-3">{p.nom}</td>
                <td className="py-2 px-3">{p.famille}</td>
                <td className="py-2 px-3">{p.unite}</td>
                <td className="py-2 px-3">{p.quantite_theorique ?? "-"}</td>
                <td className="py-2 px-3">
                  {p.pmp
                    ? `${parseFloat(p.pmp).toFixed(2)} €`
                    : p.prix_moyen
                    ? `${parseFloat(p.prix_moyen).toFixed(2)} €`
                    : "-"}
                </td>
                <td className="py-2 px-3">
                  {!p.actif && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      Inactif
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex gap-4 mt-4 items-center justify-center">
        <button
          className="btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Précédent
        </button>
        <span>
          Page {page} / {totalPages || 1}
        </span>
        <button
          className="btn"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
