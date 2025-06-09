import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import MenuPDF from "./MenuPDF";
import { useAuth } from "@/context/AuthContext";

export default function MenuDetail({ id }) {
  const { mama_id } = useAuth();
  const [ficheDetails, setFicheDetails] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!mama_id) return;
      const { data: menu, error } = await supabase
        .from("menus")
        .select("*")
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();

      if (error || !menu) return;

      const { data: fiches } = await supabase
        .from("fiches")
        .select("*")
        .in("id", menu.fiches || [])
        .eq("mama_id", mama_id);

      setFicheDetails(fiches || []);
    };

    fetchDetails();
  }, [id, mama_id]);

  if (ficheDetails.length === 0) {
    return <p className="text-gray-500 italic">Aucune fiche technique liée</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {ficheDetails.map((fiche) => (
        <div
          key={fiche.id}
          className="border rounded p-3 bg-white shadow-sm"
        >
          <div className="font-semibold text-lg">{fiche.nom}</div>
          <div className="text-sm text-gray-600">
            Type : <span className="font-medium">{fiche.type}</span> | Catégorie :{" "}
            <span className="font-medium">{fiche.categorie}</span>
          </div>
        </div>
      ))}

      <div className="mt-4">
        <MenuPDF id={id} />
      </div>
    </div>
  );
}
