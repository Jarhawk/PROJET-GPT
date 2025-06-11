import { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useComparatif } from "@/hooks/useComparatif";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function ProduitDetail({ produit, onClose, refreshList }) {
  const { editProduct, fetchProductHistory } = useProducts();
  const { comparatif, fetchComparatif } = useComparatif();
  const [history, setHistory] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchProductHistory(produit.id).then(setHistory);
    fetchComparatif();
  }, [produit.id]);

  // Historique achat
  const historiqueFournisseur = comparatif.filter(c => c.product_id === produit.id);

  // Désactivation produit
  const toggleActif = async () => {
    await editProduct(produit.id, { actif: !produit.actif });
    toast.success(produit.actif ? "Produit désactivé" : "Produit réactivé");
    refreshList?.();
    onClose?.();
  };

  // Export Excel
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(historiqueFournisseur);
    XLSX.utils.book_append_sheet(wb, ws, "HistoriquePrix");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `historique_${produit.nom}.xlsx`);
  };

  // Export PDF (à brancher jsPDF)
  const exportPDF = () => {
    toast.success("PDF export non implémenté (plug jsPDF)");
  };

  // Upload image (mock)
  const handleUpload = (file) => {
    toast.success("Upload image fictif");
    setShowUpload(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto relative">
      <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
      <h2 className="text-xl font-bold mb-2">{produit.nom}</h2>
      <div className="mb-2">
        <strong>Famille :</strong> {produit.famille}<br />
        <strong>Unité :</strong> {produit.unite}<br />
        <strong>Stock :</strong> {produit.stock}<br />
        <strong>Statut :</strong>{" "}
        <span className={produit.actif ? "badge badge-admin" : "badge badge-user"}>
          {produit.actif ? "Actif" : "Inactif"}
        </span>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={toggleActif}>
          {produit.actif ? "Désactiver" : "Réactiver"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
          Upload image
        </Button>
        <Button variant="outline" size="sm" onClick={exportExcel}>Export Excel</Button>
        <Button variant="outline" size="sm" onClick={exportPDF}>Export PDF</Button>
      </div>
      <div className="mb-4">
        <strong>Historique des mouvements :</strong>
        <ul>
          {history.map((h, i) => (
            <li key={i}>
              {h.date} : {h.quantite > 0 ? "+" : ""}{h.quantite}
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <strong>Historique achats fournisseurs :</strong>
        <table className="min-w-full bg-gray-50 rounded-xl">
          <thead>
            <tr>
              <th>Fournisseur</th>
              <th>Prix achat</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {historiqueFournisseur.map(h => (
              <tr key={h.id}>
                <td>{h.suppliers?.nom ?? "-"}</td>
                <td>{h.prix_achat?.toFixed(2) ?? "-"}</td>
                <td>{h.date_achat ? new Date(h.date_achat).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col gap-4">
            <input type="file" onChange={e => handleUpload(e.target.files[0])} />
            <Button onClick={() => setShowUpload(false)}>Annuler</Button>
          </div>
        </div>
      )}
    </div>
  );
}
