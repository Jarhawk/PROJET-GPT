// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import TableContainer from "@/components/ui/TableContainer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { Toaster, toast } from "react-hot-toast";
import { useInventaireZones } from "@/hooks/useInventaireZones";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Unauthorized from "@/pages/auth/Unauthorized";

export default function InventaireZones() {
  const { zones, loading, getZones, createZone, updateZone, deleteZone } =
    useInventaireZones();
  const { mama_id, hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess("inventaires", "peut_modifier");
  const [search, setSearch] = useState("");
  const [editZone, setEditZone] = useState(null);

  useEffect(() => {
    if (!authLoading && mama_id) {
      getZones();
    }
  }, [getZones, authLoading, mama_id]);

  const filtered = zones.filter(z => z.nom?.toLowerCase().includes(search.toLowerCase()));

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  const handleSave = async () => {
    if (!editZone.nom) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    if (editZone.id) {
      await updateZone(editZone.id, { nom: editZone.nom });
    } else {
      await createZone({ nom: editZone.nom });
    }
    setEditZone(null);
  };

  return (
    <div className="p-6 max-w-lg mx-auto text-shadow">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Zones d'inventaire</h1>
      <div className="flex gap-2 mb-4 items-end">
        <Input
          className="input flex-1"
          placeholder="Recherche zone"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <PrimaryButton type="button" onClick={() => setEditZone({ nom: "" })}>+ Nouvelle zone</PrimaryButton>
      </div>
      <TableContainer>
        <table className="min-w-full text-center text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(z => (
              <tr key={z.id} className="border-b last:border-none">
                <td className="px-2 py-1">{z.nom}</td>
                <td className="px-2 py-1">
                  <SecondaryButton size="sm" onClick={() => setEditZone(z)}>
                    Éditer
                  </SecondaryButton>
                  <Button
                    size="sm"
                    className="ml-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => deleteZone(z.id)}
                  >
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan="2" className="py-2">
                  Aucune zone
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
      <Dialog open={!!editZone} onOpenChange={v => !v && setEditZone(null)}>
      <DialogContent className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-6 max-w-sm">
        <DialogTitle className="font-bold mb-2">
          {editZone?.id ? "Modifier la zone" : "Nouvelle zone"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulaire de zone d'inventaire
        </DialogDescription>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
            className="space-y-3"
          >
            <Input
              className="input w-full"
              placeholder="Nom de la zone"
              value={editZone?.nom || ""}
              onChange={e => setEditZone(z => ({ ...z, nom: e.target.value }))}
              required
            />
            <PrimaryButton type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </PrimaryButton>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
