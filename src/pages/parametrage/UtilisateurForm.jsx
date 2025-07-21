// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useRoles } from "@/hooks/useRoles";
import { useMamas } from "@/hooks/useMamas";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function UtilisateurForm({ utilisateur, onClose }) {
  const { addUser, updateUser } = useUtilisateurs();
  const { roles, fetchRoles } = useRoles();
  const { mamas, fetchMamas } = useMamas();
  const { mama_id: myMama, role: myRole } = useAuth();
  const [nom, setNom] = useState(utilisateur?.nom || "");
  const [roleId, setRoleId] = useState(utilisateur?.role_id || "");
  const [mama, setMama] = useState(utilisateur?.mama_id || myMama);
  const [actif, setActif] = useState(utilisateur?.actif ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchMamas();
  }, [fetchRoles, fetchMamas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const data = {
      nom,
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
        value={roleId}
        onChange={e => setRoleId(e.target.value)}
        required
      >
        {roles.map(r => (
          <option key={r.id} value={r.id}>{r.nom}</option>
        ))}
      </select>
      {myRole === "superadmin" && (
        <select
          className="input mb-2"
          value={mama}
          onChange={e => setMama(e.target.value)}
          required
        >
          {mamas.map(m => (
            <option key={m.id} value={m.id}>{m.nom}</option>
          ))}
        </select>
      )}
      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
        Actif
      </label>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{utilisateur ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
