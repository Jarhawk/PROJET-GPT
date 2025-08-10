// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRGPD } from "@/hooks/useRGPD";
import { useAuth } from '@/hooks/useAuth';
import toast from "react-hot-toast";

export default function DeleteAccountButton() {
  const { purgeUserData } = useRGPD();
  const { user_id } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user_id) return null;

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement votre compte ?")) return;
    setLoading(true);
    const { error } = await purgeUserData(user_id);
    if (error) toast.error("Erreur lors de la suppression");
    else toast.success("Compte supprimé");
    setLoading(false);
  }

  return (
    <Button onClick={handleDelete} disabled={loading} variant="destructive">
      {loading ? "Suppression..." : "Supprimer mon compte"}
    </Button>
  );
}
