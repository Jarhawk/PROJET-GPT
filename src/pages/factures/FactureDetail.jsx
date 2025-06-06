import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast, { Toaster } from "react-hot-toast";

export default function FactureDetail() {
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [facture, setFacture] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  // Charge facture, lignes et commentaires
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated || !id) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("invoices")
        .select("*, suppliers(nom)")
        .eq("id", id)
        .eq("mama_id", claims.mama_id)
        .single(),
      supabase
        .from("invoice_lines")
        .select("*, products(nom, unite)")
        .eq("invoice_id", id)
        .eq("mama_id", claims.mama_id),
      supabase
        .from("invoice_comments")
        .select("*, users(email)")
        .eq("invoice_id", id)
        .order("created_at", { ascending: true }),
    ]).then(([factureRes, lignesRes, commentsRes]) => {
      if (factureRes.error || !factureRes.data) {
        setError("Facture introuvable ou accès refusé.");
        setFacture(null);
      } else {
        setFacture(factureRes.data);
      }
      setLignes(lignesRes.data || []);
      setComments(commentsRes.data || []);
      setLoading(false);
    });
  }, [claims?.mama_id, isAuthenticated, id]);

  const totalHT = lignes.reduce((acc, l) => acc + (l.quantite * l.prix_unitaire), 0);
  const totalTVA = lignes.reduce((acc, l) => acc + (l.quantite * l.prix_unitaire * (parseFloat(l.tva || 20) / 100)), 0);
  const totalTTC = totalHT + totalTVA;

  // Export PDF
  const exportPDF = () => {
    if (!facture) return;
    const doc = new jsPDF();
    doc.text(`Facture ${facture.numero}`, 10, 10);
    doc.text(`Date: ${facture.date_facture ? new Date(facture.date_facture).toLocaleDateString() : "-"}`, 10, 20);
    doc.text(`Fournisseur: ${facture.suppliers?.nom || "-"}`, 10, 30);
    doc.text(`Montant TTC: ${totalTTC.toFixed(2)} €`, 10, 40);

    doc.autoTable({
      startY: 50,
      head: [["Produit", "Quantité", "PU", "TVA (%)", "HT", "TVA (€)", "TTC"]],
      body: lignes.map(l => [
        l.products?.nom || "-",
        l.quantite,
        l.prix_unitaire.toFixed(2),
        l.tva ?? 20,
        (l.quantite * l.prix_unitaire).toFixed(2),
        ((l.quantite * l.prix_unitaire) * (parseFloat(l.tva || 20) / 100)).toFixed(2),
        (l.quantite * l.prix_unitaire * (1 + (parseFloat(l.tva || 20) / 100))).toFixed(2),
      ]),
      foot: [
        ["", "", "", "Totaux", totalHT.toFixed(2), totalTVA.toFixed(2), totalTTC.toFixed(2)],
      ]
    });
    doc.save(`Facture_${facture.numero}.pdf`);
    toast.success("PDF généré !");
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    await supabase.from("invoice_comments").insert({
      invoice_id: id,
      user_id: claims?.user_id,
      mama_id: claims?.mama_id,
      comment: newComment,
    });
    setNewComment("");
    toast.success("Commentaire ajouté !");
    // Recharge
    const { data } = await supabase
      .from("invoice_comments")
      .select("*, users(email)")
      .eq("invoice_id", id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Toaster position="top-right" />
        <span className="text-mamastock-gold animate-pulse">
          Chargement de la facture...
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !facture) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-red-700">
        {error || "Facture introuvable ou accès refusé."}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-mamastock-gold">
          Facture {facture.numero}
        </h1>
        <div className="flex gap-2">
          <button
            className="btn bg-mamastock-gold text-white"
            onClick={() => navigate(`/factures/edit/${facture.id}`)}
          >
            Modifier
          </button>
          <button className="btn" onClick={exportPDF}>Exporter PDF</button>
        </div>
      </div>
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <p>
          <strong>Date :</strong>{" "}
          {facture.date_facture
            ? new Date(facture.date_facture).toLocaleDateString()
            : "-"}
        </p>
        <p>
          <strong>Fournisseur :</strong> {facture.suppliers?.nom || "-"}
        </p>
        <p>
          <strong>Montant TTC :</strong> {totalTTC.toFixed(2)} €
        </p>
        <p>
          <strong>Statut :</strong> {facture.statut}
        </p>
        <p>
          <strong>Commentaire :</strong> {facture.commentaire || "-"}
        </p>
      </div>

      {/* Tableau lignes de facture */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-bold text-mamastock-gold mb-4">
          Lignes de la facture
        </h2>
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left">Produit</th>
              <th className="px-3 py-2 text-left">Unité</th>
              <th className="px-3 py-2 text-left">Quantité</th>
              <th className="px-3 py-2 text-left">PU</th>
              <th className="px-3 py-2 text-left">TVA (%)</th>
              <th className="px-3 py-2 text-left">HT</th>
              <th className="px-3 py-2 text-left">TVA (€)</th>
              <th className="px-3 py-2 text-left">TTC</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-gray-500">
                  Aucune ligne sur cette facture.
                </td>
              </tr>
            )}
            {lignes.map((ligne) => (
              <tr key={ligne.id}>
                <td className="px-3 py-2">{ligne.products?.nom || "-"}</td>
                <td className="px-3 py-2">{ligne.products?.unite || "-"}</td>
                <td className="px-3 py-2">{ligne.quantite}</td>
                <td className="px-3 py-2">
                  {ligne.prix_unitaire
                    ? ligne.prix_unitaire.toFixed(2) + " €"
                    : "-"}
                </td>
                <td className="px-3 py-2">{ligne.tva ?? 20}</td>
                <td className="px-3 py-2">
                  {(ligne.quantite * ligne.prix_unitaire).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  {((ligne.quantite * ligne.prix_unitaire) * (parseFloat(ligne.tva || 20) / 100)).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  {(ligne.quantite * ligne.prix_unitaire * (1 + (parseFloat(ligne.tva || 20) / 100))).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={5}>Totaux</td>
              <td>{totalHT.toFixed(2)}</td>
              <td>{totalTVA.toFixed(2)}</td>
              <td>{totalTTC.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Commentaires multi-utilisateur */}
      <div className="bg-white shadow rounded-xl p-6 mt-4">
        <h2 className="font-bold text-mamastock-gold mb-2">Commentaires</h2>
        <div className="mb-2">
          {comments.map(c => (
            <div key={c.id} className="mb-1">
              <span className="font-semibold">{c.users?.email ?? "?"}</span>
              <span className="text-xs text-gray-500 ml-2">{new Date(c.created_at).toLocaleString()}</span>
              <div>{c.comment}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input input-bordered flex-1"
            placeholder="Ajouter un commentaire"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            maxLength={500}
          />
          <button className="btn" onClick={handleComment}>Envoyer</button>
        </div>
      </div>
    </div>
  );
}
