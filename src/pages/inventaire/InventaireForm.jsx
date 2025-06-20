import { useProducts } from "@/hooks/useProducts";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

function InventaireFormPage() {
  const { data: products, loading: loadingProducts } = useProducts();
  const { mama_id } = useAuth();
  const [zone, setZone] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [stockFinal, setStockFinal] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkIfLocked = async () => {
      if (!zone) return;
      const { data } = await supabase
        .from("inventaires")
        .select("*")
        .eq("date", date)
        .eq("zone", zone)
        .eq("mama_id", mama_id)
        .eq("etat", "cloturé");

      setIsLocked(data?.length > 0);
    };

    checkIfLocked();
  }, [zone, date, mama_id]);

  const handleChange = (productId, value) => {
    setStockFinal((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!zone) return toast.error("Veuillez sélectionner une zone.");
    if (isLocked) return toast.error("Inventaire clôturé");

    setSaving(true);
    const { data: inv, error: invError } = await supabase
      .from("inventaires")
      .insert({ date, zone, etat: "brouillon", mama_id })
      .select()
      .single();

    if (invError) {
      toast.error("Erreur lors de l'enregistrement");
      setSaving(false);
      return;
    }

    for (const productId of Object.keys(stockFinal)) {
      const quantite = parseFloat(stockFinal[productId]);
      if (!isNaN(quantite)) {
        const { error } = await supabase.from("inventaire_lignes").insert({
          inventaire_id: inv.id,
          product_id: productId,
          stock_final: quantite,
          mama_id,
        });
        if (error) {
          toast.error("Erreur sur une ligne d'inventaire");
          setSaving(false);
          return;
        }
      }
    }

    toast.success("Inventaire enregistré");
    setSaving(false);
  };

  return (
    <div className="p-6 bg-mamastock-bg min-h-screen">
      <Toaster />
      <h1 className="text-3xl font-bold text-mamastock-gold mb-6">Saisie Inventaire</h1>

      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label className="text-sm block">Zone</label>
          <select
            className="border rounded px-3 py-2"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            <option value="">Choisir une zone</option>
            <option value="cuisine">Cuisine</option>
            <option value="bar">Bar</option>
            <option value="cave">Cave</option>
            <option value="frigo">Frigo</option>
          </select>
        </div>
        <div>
          <label className="text-sm block">Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {isLocked && (
          <span className="text-red-600 font-semibold">
            Inventaire clôturé – saisie impossible
          </span>
        )}
      </div>

      {!zone ? (
        <p className="text-gray-600 italic">Sélectionnez une zone pour afficher les produits</p>
      ) : (
        <>
          <table className="w-full bg-white rounded-xl shadow text-sm mt-4">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-left">Article</th>
                <th className="p-3 text-left">Stock final</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts ? (
                <tr>
                  <td className="p-3" colSpan="2">
                    Chargement...
                  </td>
                </tr>
              ) : (
                products
                  .sort((a, b) => a.nom.localeCompare(b.nom))
                  .map((prod) => (
                    <tr key={prod.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{prod.nom}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          className="border rounded px-2 py-1 w-32"
                          value={stockFinal[prod.id] || ""}
                          disabled={isLocked}
                          onChange={(e) => handleChange(prod.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={handleSubmit}
              disabled={isLocked || saving}
              className="bg-mamastock-gold text-white font-bold px-6 py-2 rounded disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              onClick={() => window.open(`/ecarts?date=${date}&zone=${zone}`, "_blank")}
              className="bg-mamastock-gold hover:bg-mamastock-gold-hover text-white font-bold px-6 py-2 rounded"
            >
              📊 Voir les écarts
            </button>

            <button
              onClick={() => {
                const firstDay = date.slice(0, 7) + "-01";
                window.open(`/ecarts?mode=pdf&mois=${firstDay}&zone=${zone}`, "_blank");
              }}
              className="bg-mamastock-gold hover:bg-mamastock-gold-hover text-white font-bold px-6 py-2 rounded"
            >
              🧾 Export PDF – Écarts du mois
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function InventaireForm() {
  return (
    <InventaireFormPage />
  );
}
