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
  const [email, setEmail] = useState(utilisateur?.email || "");
  const [role, setRole] = useState(utilisateur?.role || "user");
  const [mama, setMama] = useState(utilisateur?.mama_id || myMama);
  const [actif, setActif] = useState(utilisateur?.actif ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchMamas();
  }, [fetchRoles, fetchMamas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = {
      email,
      role,
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
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-4">
        {utilisateur ? "Modifier l’utilisateur" : "Ajouter un utilisateur"}
      </h2>
      <input
        className="input mb-2"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
        disabled={!!utilisateur?.id}
      />
      <select
        className="input mb-2"
        value={role}
        onChange={e => setRole(e.target.value)}
        required
      >
        {roles.map(r => (
          <option key={r.id} value={r.nom}>{r.nom}</option>
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
