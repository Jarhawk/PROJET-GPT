// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import MamaForm from "./MamaForm";
import toast, { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Mamas() {
  const { mama_id: myMama, role } = useAuth();
  const [mamas, setMamas] = useState([]);
  const [search, setSearch] = useState("");
  const [editMama, setEditMama] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchMamas();
     
  }, []);

  const fetchMamas = async () => {
    setLoading(true);
    let query = supabase.from("mamas").select("*");
    if (role !== "superadmin") query = query.eq("id", myMama);
    const { data, error } = await query.order("nom", { ascending: true });
    if (!error) setMamas(data || []);
    setLoading(false);
  };

  const handleDelete = async id => {
    if (role !== "superadmin" && id !== myMama) {
      toast.error("Action non autorisée");
      return;
    }
    const { error } = await supabase
      .from("mamas")
      .delete()
      .eq("id", id);
    if (!error) {
      toast.success("Établissement supprimé.");
      fetchMamas();
    } else {
      toast.error("Erreur lors de la suppression.");
    }
    setConfirmDeleteId(null);
  };

  const filtered = mamas.filter(
    m =>
      m.nom?.toLowerCase().includes(search.toLowerCase()) ||
      m.ville?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl mx-auto text-shadow">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">
        Établissements (MAMA)
      </h1>
      <div className="flex gap-4 mb-4 items-end">
        <input
          className="input input-bordered w-64"
          placeholder="Recherche nom, ville"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {role === "superadmin" && (
          <Button onClick={() => setEditMama({ nom: "", ville: "", actif: true })}>
            + Nouvel établissement
          </Button>
        )}
      </div>
      <TableContainer className="mb-6">
        {loading ? (
          <LoadingSpinner message="Chargement…" />
        ) : (
          <table className="min-w-full table-auto text-center">
            <thead>
              <tr>
                <th className="px-2 py-1">Nom</th>
                <th className="px-2 py-1">Ville</th>
                <th className="px-2 py-1">Actif</th>
                <th className="px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td className="px-2 py-1">{m.nom}</td>
                  <td className="px-2 py-1">{m.ville}</td>
                  <td className="px-2 py-1">
                    <span
                      className={
                        m.actif
                          ? "inline-block bg-green-100 text-green-800 px-2 rounded-full"
                          : "inline-block bg-red-100 text-red-800 px-2 rounded-full"
                      }
                    >
                      {m.actif ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td className="px-2 py-1 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditMama(m)}
                      disabled={loading || (role !== "superadmin" && m.id !== myMama)}
                    >
                      Éditer
                    </Button>
                    {confirmDeleteId === m.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(m.id)}
                          disabled={loading || (role !== "superadmin" && m.id !== myMama)}
                        >
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={loading}
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmDeleteId(m.id)}
                        disabled={loading || (role !== "superadmin" && m.id !== myMama)}
                      >
                        Supprimer
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-gray-400">
                    Aucun établissement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </TableContainer>
      <Dialog open={!!editMama} onOpenChange={v => !v && setEditMama(null)}>
        <DialogContent className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-6 max-w-md">
          <DialogTitle className="font-bold mb-2">
            {editMama?.id ? "Modifier l'établissement" : "Nouvel établissement"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire établissement
          </DialogDescription>
          <MamaForm
            mama={editMama}
            onSaved={() => {
              fetchMamas();
              setEditMama(null);
            }}
            onClose={() => setEditMama(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
