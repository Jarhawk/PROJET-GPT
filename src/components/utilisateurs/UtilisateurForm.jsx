// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useRoles } from "@/hooks/useRoles";
import useAuth from "@/hooks/useAuth";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";

export default function UtilisateurForm({ utilisateur, onClose }) {
  const { addUser, updateUser } = useUtilisateurs();
  const { roles, fetchRoles } = useRoles();
  const { mama_id } = useAuth();
  const [nom, setNom] = useState(utilisateur?.nom || "");
  const [email, setEmail] = useState(utilisateur?.email || "");
  const [roleId, setRoleId] = useState(utilisateur?.role_id || "");
  const [actif, setActif] = useState(utilisateur?.actif ?? true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const data = {
      nom,
      email,
      role_id: roleId,
      actif,
      mama_id,
      ...(password && { password }),
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
      <Input
        className="mb-2"
        type="text"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom"
        required
      />
      <Input
        className="mb-2"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <Select
        className="mb-2"
        value={roleId}
        onChange={e => setRoleId(e.target.value)}
        required
      >
        {roles.map(r => (
          <option key={r.id} value={r.id}>{r.nom}</option>
        ))}
      </Select>
      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
        Actif
      </label>
      {!utilisateur && (
        <Input
          className="mb-2"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
          minLength={6}
        />
      )}
      {utilisateur && (
        <Input
          className="mb-2"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe (laisser vide si inchangé)"
          minLength={6}
        />
      )}
      <div className="flex gap-2 mt-4">
        <PrimaryButton type="submit" disabled={loading} className="flex items-center gap-2">
          {loading && <span className="loader-glass" />}
          {utilisateur ? "Modifier" : "Ajouter"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onClose}>Annuler</SecondaryButton>
      </div>
    </form>
  );
}
