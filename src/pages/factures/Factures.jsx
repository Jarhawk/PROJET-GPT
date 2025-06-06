// src/pages/Factures.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 50;

export default function Factures() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();

  // États du composant
  const [factures, setFactures] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [fournisseurs, setFournisseurs] = useState([]);

  // Sécurité : redirection login si non auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Charge les fournisseurs pour le filtre
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated) return;
    supabase
      .from("suppliers")
      .select("id, nom")
      .eq("mama_id", claims.mama_id)
      .then(({ data }) => setFournisseurs(data || []));
  }, [claims?.mama_id, isAuthenticated]);

  // Charge les factures paginées avec filtres
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated) return;

    setLoading(true);

    let query = supabase
      .from("invoices")
      .select("*, suppliers(nom)", { count: "exact" })
      .eq("mama_id", claims.mama_id);

    if (fournisseurFilter) {
      query = query.eq("supplier_id", fournisseurFilter);
    }
    if (statutFilter) {
      query = query.eq("statut", statutFilter);
    }
    if (search) {
      query = query.or(
        `numero.ilike.%${search}%,commentaire.ilike.%${search}%`
      );
    }

    query = query
      .order("date_facture", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    query.then(({ data, count, error }) => {
      if (error) {
        setFactures([]);
        setTotal(0);
      } else {
        setFactures(data || []);
        setTotal(count || 0);
      }
      setLoading(false);
    });
  }, [claims?.mama_id, isAuthenticated, page, fournisseurFilter, statutFilter, search]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-mamastock-gold animate-pulse">Chargement des factures...</span>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-mamastock-gold mb-6">
        Factures
      </h1>
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        <input
          className="input input-bordered"
          type="text"
          placeholder="Recherche N° facture, commentaire..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="select select-bordered"
          value={fournisseurFilter}
          onChange={(e) => {
            setFournisseurFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous fournisseurs</option>
          {fournisseurs.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>
        <select
          className="select select-bordered"
          value={statutFilter}
          onChange={(e) => {
            setStatutFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous statuts</option>
          <option value="validée">Validée</option>
          <option value="en_attente">En attente</option>
          <option value="rejetée">Rejetée</option>
        </select>
        <button
          className="btn bg-mamastock-gold text-white"
          onClick={() => navigate("/factures/nouveau")}
        >
          + Nouvelle facture
        </button>
      </div>
      {/* Table factures */}
      <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-mamastock-bg text-mamastock-gold">
              <th className="py-2 px-3 text-left">N°</th>
              <th className="py-2 px-3 text-left">Date</th>
              <th className="py-2 px-3 text-left">Fournisseur</th>
              <th className="py-2 px-3 text-left">Montant</th>
              <th className="py-2 px-3 text-left">Statut</th>
              <th className="py-2 px-3 text-left">Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {factures.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Aucune facture trouvée
                </td>
              </tr>
            )}
            {factures.map((f) => (
              <tr
                key={f.id}
                className="hover:bg-mamastock-bg/10 cursor-pointer"
                onClick={() => navigate(`/factures/${f.id}`)}
              >
                <td className="py-2 px-3">{f.numero}</td>
                <td className="py-2 px-3">{f.date_facture ? new Date(f.date_facture).toLocaleDateString() : "-"}</td>
                <td className="py-2 px-3">{f.suppliers?.nom || "-"}</td>
                <td className="py-2 px-3">{f.montant ? f.montant.toFixed(2) + " €" : "-"}</td>
                <td className="py-2 px-3">{f.statut}</td>
                <td className="py-2 px-3">{f.commentaire}</td>
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
