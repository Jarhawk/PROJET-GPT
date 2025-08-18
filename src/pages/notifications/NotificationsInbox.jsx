// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import useNotifications from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";

export default function NotificationsInbox() {
  const {
    items,
    loading,
    error,
    fetchNotifications,
    markAsRead,
  } = useNotifications();
  const [filters, setFilters] = useState({ type: "" });

  useEffect(() => {
    fetchNotifications(filters);
  }, [fetchNotifications, filters]);

  const handleChange = (e) =>
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="p-6 text-sm">
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <div className="flex gap-2 mb-4">
        <select
          name="type"
          value={filters.type}
          onChange={handleChange}
          className="form-input"
        >
          <option value="">-- Type --</option>
          <option value="info">Info</option>
          <option value="alerte">Alerte</option>
          <option value="erreur">Erreur</option>
        </select>
        <Button onClick={() => fetchNotifications(filters)}>Filtrer</Button>
      </div>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-600">{error}</div>}
      <TableContainer className="mt-4">
        <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Titre</th>
            <th className="px-2 py-1 text-left">Texte</th>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((n) => (
            <tr key={n.id} className={n.lu ? "" : "font-bold"}>
              <td className="px-2 py-1">{n.titre}</td>
              <td className="px-2 py-1">{n.texte}</td>
              <td className="px-2 py-1">
                {new Date(n.created_at).toLocaleString()}
              </td>
              <td className="px-2 py-1 text-right">
                {!n.lu && (
                  <Button size="sm" onClick={() => markAsRead(n.id)}>
                    Marquer comme lu
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && !loading && (
            <tr>
              <td colSpan="4" className="py-4 text-center text-gray-500">
                Aucune notification
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
