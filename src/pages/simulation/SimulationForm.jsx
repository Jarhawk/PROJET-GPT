// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
import GlassCard from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function SimulationForm({ addRecipe, setPrix }) {
  const { mama_id, loading: authLoading } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [prix, setPrixLocal] = useState("");

  useEffect(() => {
    if (!mama_id || authLoading) return;
    supabase
      .from("fiches")
      .select("*")
      .eq("mama_id", mama_id)
      .then(({ data }) => setRecipes(data || []));
  }, [mama_id, authLoading]);

  const handleAdd = () => {
    if (!selectedId) {
      toast.error("Sélectionnez une fiche");
      return;
    }
    const recette = recipes.find(r => r.id === selectedId);
    if (recette) {
      addRecipe(recette);
      setPrix("");
      setSelectedId("");
    }
  };

  return (
    <GlassCard title="Ajouter une fiche" width="max-w-md">
      <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
        <option value="">Sélectionner une fiche</option>
        {recipes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nom}
          </option>
        ))}
      </Select>
      <Input
        type="number"
        value={prix}
        onChange={(e) => {
          setPrixLocal(e.target.value);
          setPrix(selectedId, parseFloat(e.target.value));
        }}
        placeholder="Prix de vente TTC (€)"
      />
      <PrimaryButton type="button" onClick={handleAdd}>
        Ajouter
      </PrimaryButton>
    </GlassCard>
  );
}
