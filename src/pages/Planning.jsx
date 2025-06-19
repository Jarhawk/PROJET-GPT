import { useEffect, useState } from "react";
import { usePlanning } from "@/hooks/usePlanning";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

export default function Planning() {
  const { items, loading, error, fetchPlanning, addPlanning } = usePlanning();
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchPlanning();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addPlanning({ date_prevue: date, notes });
    setDate("");
    setNotes("");
  };

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Planning prévisionnel</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4 items-end">
        <label className="sr-only" htmlFor="date_prevue">Date prévue</label>
        <input
          id="date_prevue"
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <label className="sr-only" htmlFor="notes">Notes</label>
        <input
          id="notes"
          className="input flex-1"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button type="submit">Ajouter</Button>
      </form>
      <table className="min-w-full text-sm bg-white rounded-xl shadow-md">
        <caption className="sr-only">Dates planifiées à venir</caption>
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
