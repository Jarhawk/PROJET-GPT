// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useRoles } from "@/hooks/useRoles";
import useAuth from "@/hooks/useAuth";
import GlassCard from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import toast from "react-hot-toast";

export default function UtilisateurForm({ utilisateur, onClose }) {
  const { createUtilisateur, updateUtilisateur } = useUtilisateurs();
  const { roles, fetchRoles } = useRoles();
  const { mama_id } = useAuth();
  const [nom, setNom] = useState(utilisateur?.nom || "");
  const [email, setEmail] = useState(utilisateur?.email || "");
  const [roleId, setRoleId] = useState(utilisateur?.role_id || "");
  const [actif, setActif] = useState(utilisateur?.actif ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const data = { nom, email, role_id: roleId, actif, mama_id };
    try {
      if (utilisateur?.id) {
        await updateUtilisateur(utilisateur.id, data);
        toast.success("Utilisateur modifié !");
      } else {
        await createUtilisateur(data);
        toast.success("Utilisateur créé !");
      }
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard title={utilisateur ? "Modifier l’utilisateur" : "Ajouter un utilisateur"}>
      <form onSubmit={handleSubmit} className="space-y-2">
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
          readOnly={!!utilisateur?.id}
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
        <div className="flex gap-2 mt-4">
          <PrimaryButton type="submit" disabled={loading} className="flex items-center gap-2">
            {loading && <span className="loader-glass" />}
            {utilisateur ? "Modifier" : "Ajouter"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose}>Annuler</SecondaryButton>
        </div>
      </form>
    </GlassCard>
  );
}
