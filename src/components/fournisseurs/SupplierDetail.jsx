import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { motion as Motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

export default function SupplierDetail({ supplier, onClose, glass }) {
  const [_stats, _setStats] = useState({});
  const [_contacts, _setContacts] = useState([]);
  const [_produits, _setProduits] = useState([]);
  const [_graphAchats, _setGraphAchats] = useState([]);
  const [_topProduits, _setTopProduits] = useState([]);
  const [_historique, _setHistorique] = useState([]);
  const [_selectedProduit, _setSelectedProduit] = useState("");

  useEffect(() => {
    if (!supplier) return;
    // Tu peux faire du Promise.all ici pour tout charger plus vite
    (async () => {
      const { data: contactsData } = await supabase
        .from("fournisseur_contacts")
        .select("*")
        .eq("fournisseur_id", supplier.id);
      _setContacts(contactsData || []);
      const { data: produitsData } = await supabase
        .from("products")
        .select("id, nom")
        .eq("main_supplier_id", supplier.id);
      _setProduits(produitsData || []);
      // Charger _stats, graphique, top _produits… (à compléter selon besoin)
    })();
  }, [supplier]);

  // Export Excel (simple, tu peux l’enrichir)
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([supplier]);
    XLSX.utils.book_append_sheet(wb, ws, "Fournisseur");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `Fournisseur_${supplier.nom}.xlsx`);
    toast.success("Export Excel généré !");
  };

  return (
    <Motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${glass ? 'backdrop-blur-lg bg-black/20' : ''}`}
    >
      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-mamastockGold relative p-8 glass-anim">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl text-mamastockGold hover:text-black focus:outline-none"
          aria-label="Fermer"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-mamastockGold mb-2">{supplier.nom}</h2>
        <div className="mb-4">
          <p><strong>Ville :</strong> {supplier.ville || "-"}</p>
          <p><strong>Email :</strong> {supplier.email || "-"}</p>
          <p><strong>Téléphone :</strong> {supplier.telephone || "-"}</p>
          <p>
            <strong>Statut :</strong>{" "}
            {supplier.actif
              ? <span className="text-green-600 font-semibold">Actif</span>
              : <span className="text-red-600 font-semibold">Inactif</span>
            }
          </p>
        </div>
        <Button onClick={handleExport}>Export Excel</Button>
        {/* TODO : Stats, graphiques, _contacts, _historique, etc. à brancher */}
      </div>
    </Motion.div>
  );
}
