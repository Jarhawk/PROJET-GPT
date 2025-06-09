import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import MamaForm from "./MamaForm";
import { useMamas } from "@/hooks/useMamas";
import toast, { Toaster } from "react-hot-toast";

export default function Mamas() {
  const { mamas, loading, error, refetch } = useMamas();
  const [search, setSearch] = useState("");
  const [editMama, setEditMama] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = async id => {
    const { error } = await supabase.from("mamas").delete().eq("id", id);
    if (!error) {
      toast.success("Établissement supprimé.");
      refetch();
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
    <div className="p-8 max-w-4xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">
        Établissements (MAMA)
      </h1>
      {error && (
        <div className="text-center text-red-600 mb-2">
          Erreur lors du chargement des établissements.
        </div>
      )}
      <div className="flex gap-4 mb-4 items-end">
        <input
          className="input input-bordered w-64"
          placeholder="Recherche nom, ville"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => setEditMama({ nom: "", ville: "", actif: true })}>
          + Nouvel établissement
        </Button>
      </div>
      <div className="bg-white shadow rounded-xl overflow-x-auto mb-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <span className="animate-spin mr-2">⏳</span>Chargement…
          </div>
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
                      disabled={loading}
                    >
                      Éditer
                    </Button>
                    {confirmDeleteId === m.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(m.id)}
                          disabled={loading}
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
                        disabled={loading}
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
      </div>
      <Dialog open={!!editMama} onOpenChange={v => !v && setEditMama(null)}>
        <DialogContent className="bg-white rounded-xl shadow-lg p-6 max-w-md">
          <MamaForm
            mama={editMama}
            onSaved={() => {
              refetch();
              setEditMama(null);
            }}
            onClose={() => setEditMama(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
