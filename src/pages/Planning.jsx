import { useEffect, useState } from "react";
import { usePlanning } from "@/hooks/usePlanning";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";

export default function Planning() {
  const { mama_id } = useAuth();
  const { items, loading, error, fetchPlanning, addPlanning } = usePlanning();
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mama_id) fetchPlanning();
  }, [fetchPlanning, mama_id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!date) {
      toast.error("Date requise");
      return;
    }
    try {
      setSaving(true);
      await addPlanning({ date_prevue: date, notes });
      toast.success("Entrée ajoutée !");
      setDate("");
      setNotes("");
      fetchPlanning();
    } catch (err) {
      console.error("Erreur ajout planning:", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Planning prévisionnel</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4 items-end">
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          className="input flex-1"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button type="submit" disabled={saving}>Ajouter</Button>
      </form>
      <table className="min-w-full text-sm bg-white rounded-xl shadow-md">
        <thead>
          <tr>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td className="px-2 py-1 whitespace-nowrap">{p.date_prevue}</td>
              <td className="px-2 py-1">{p.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
