// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const ROLES = [
  { value: "superadmin", label: "Superadmin" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "Utilisateur" },
];

export default function UtilisateurForm({ utilisateur, onClose }) {
  const { addUser, updateUser } = useUtilisateurs();
  const [nom, setNom] = useState(utilisateur?.nom || "");
  const [role, setRole] = useState(utilisateur?.role || "user");
  const [actif, setActif] = useState(utilisateur?.actif ?? true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const data = {
      nom,
      role,
      actif,
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
      <input
        className="input mb-2"
        type="text"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom"
        required
      />
      <select
        className="input mb-2"
        value={role}
        onChange={e => setRole(e.target.value)}
        required
      >
        {ROLES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
        Actif
      </label>
      {!utilisateur && (
        <input
          className="input mb-2"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
          minLength={6}
        />
      )}
      {utilisateur && (
        <input
          className="input mb-2"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe (laisser vide si inchangé)"
          minLength={6}
        />
      )}
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{utilisateur ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
