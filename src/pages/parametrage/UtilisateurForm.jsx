// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useRoles } from "@/hooks/useRoles";
import { useMamas } from "@/hooks/useMamas";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import toast from "react-hot-toast";

export default function UtilisateurForm({ utilisateur, onClose }) {
  const { addUser, updateUser } = useUtilisateurs();
  const { roles, fetchRoles } = useRoles();
  const { mamas, fetchMamas } = useMamas();
  const { mama_id: myMama, role: myRole, loading: authLoading } = useAuth();
  const [nom, setNom] = useState(utilisateur?.nom || "");
  const [email, setEmail] = useState(utilisateur?.email || "");
  const [roleId, setRoleId] = useState(utilisateur?.role_id || "");
  const [mama, setMama] = useState(utilisateur?.mama_id || myMama);
  const [actif, setActif] = useState(utilisateur?.actif ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchMamas();
  }, [fetchRoles, fetchMamas]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const data = {
      nom,
      email,
      role_id: roleId,
      actif,
      mama_id: mama,
    };
    try {
      if (utilisateur?.id) {
        await updateUser(utilisateur.id, data);
        toast.success("Utilisateur modifié !");
      } else {
        await addUser(data);
        toast.success("Utilisateur ajouté !");
      }
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-glass border border-borderGlass backdrop-blur p-6 rounded-2xl shadow-lg max-w-xl mx-auto"
    >
      <h2 className="text-lg font-bold mb-4">
        {utilisateur ? "Modifier l’utilisateur" : "Ajouter un utilisateur"}
      </h2>
      <Label htmlFor="nom">Nom</Label>
      <Input
        id="nom"
        className="mb-2"
        type="text"
        value={nom}
        onChange={e => setNom(e.target.value)}
        required
      />
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        className="mb-2"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        readOnly={!!utilisateur?.id}
      />
      <Label htmlFor="role">Rôle</Label>
      <Select
        id="role"
        className="mb-2"
        value={roleId}
        onChange={e => setRoleId(e.target.value)}
        required
      >
        {roles
          .filter(r => myRole === "superadmin" || r.nom !== "superadmin")
          .map(r => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
      </Select>
      {myRole === "superadmin" && (
        <>
          <Label htmlFor="mama">Établissement</Label>
          <Select
            id="mama"
            className="mb-2"
            value={mama}
            onChange={e => setMama(e.target.value)}
            required
          >
            {mamas.map(m => (
              <option key={m.id} value={m.id}>{m.nom}</option>
            ))}
          </Select>
        </>
      )}
      <label className="flex items-center gap-2 mb-2">
        <input id="actif" type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
        <Label htmlFor="actif" className="!mb-0">Actif</Label>
      </label>
      <div className="flex gap-2 mt-4">
        <PrimaryButton type="submit" disabled={loading}>{utilisateur ? "Modifier" : "Ajouter"}</PrimaryButton>
        <SecondaryButton type="button" onClick={onClose}>Annuler</SecondaryButton>
      </div>
    </form>
  );
}
