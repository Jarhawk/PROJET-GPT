// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import UtilisateurForm from "@/components/utilisateurs/UtilisateurForm";

export default function Utilisateurs() {
  const { mama_id } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("utilisateurs")
      .select("id, email")
      .eq("mama_id", mama_id)
      .order("email", { ascending: true });
    if (error) setError(error);
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, [mama_id]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Utilisateurs</h1>
      <Button onClick={() => { setSelected(null); setShowForm(true); }}>
        Ajouter un utilisateur
      </Button>

      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-500">{error.message}</p>}

      <ul className="mt-4 space-y-2">
        {users.map((u) => (
          <li key={u.id} className="flex justify-between items-center">
            <span>{u.email}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setSelected(u); setShowForm(true); }}
            >
              Modifier
            </Button>
          </li>
        ))}
      </ul>

      {showForm && (
        <UtilisateurForm
          utilisateur={selected}
          onClose={() => { setShowForm(false); setSelected(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}

