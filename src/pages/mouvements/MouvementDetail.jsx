import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MouvementDetail({ id }) {
  const [mouvement, setMouvement] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible || !id) return;

    const fetchMouvement = async () => {
      const { data, error } = await supabase
        .from("mouvements")
        .select("id, date, quantite, zone_source, zone_destination, produits(nom)")
        .eq("id", id)
        .single();

      if (!error) setMouvement(data);
    };

    fetchMouvement();
  }, [visible, id]);

  return (
    <div className="mt-2">
      <button
        onClick={() => setVisible((v) => !v)}
        className="text-sm text-blue-600 hover:underline"
      >
        {visible ? "Masquer les détails" : "Voir les détails"}
      </button>

      {visible && mouvement && (
        <div className="border mt-2 p-4 rounded-xl bg-white shadow">
          <h3 className="text-md font-bold text-mamastock-gold mb-2">Détail du mouvement</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Date :</strong> {mouvement.date}</li>
            <li><strong>Produit :</strong> {mouvement.produits?.nom || "–"}</li>
            <li><strong>Quantité :</strong> {mouvement.quantite}</li>
            <li><strong>Zone source :</strong> {mouvement.zone_source}</li>
            <li><strong>Zone destination :</strong> {mouvement.zone_destination}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
