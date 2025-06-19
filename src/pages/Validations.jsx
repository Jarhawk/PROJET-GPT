import { useEffect, useState } from "react";
import { useValidations } from "@/hooks/useValidations";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";

export default function Validations() {
  const validations = useValidations();
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({ module: "", entity_id: "", action: "" });

  useEffect(() => {
    validations.fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await validations.addRequest(form);
    toast.success("Demande envoyée");
    setForm({ module: "", entity_id: "", action: "" });
  };

  const handleUpdate = async (id, status) => {
    await validations.updateStatus(id, status);
    toast.success("Statut mis à jour");
  };

  const { items, loading, error } = validations;

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto text-sm">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Validations</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-end">
        <label className="sr-only" htmlFor="module">Module</label>
        <input
          id="module"
          className="input"
          placeholder="Module"
          value={form.module}
          onChange={(e) => setForm(f => ({ ...f, module: e.target.value }))}
          required
        />
        <label className="sr-only" htmlFor="action">Action</label>
        <input
          id="action"
          className="input"
          placeholder="Action"
          value={form.action}
          onChange={(e) => setForm(f => ({ ...f, action: e.target.value }))}
          required
        />
        <label className="sr-only" htmlFor="entity_id">Entité</label>
        <input
          id="entity_id"
          className="input"
          placeholder="Entité"
          value={form.entity_id}
          onChange={(e) => setForm(f => ({ ...f, entity_id: e.target.value }))}
        />
        <Button type="submit">Demander</Button>
      </form>
      <table className="min-w-full bg-white rounded-xl shadow-md">
        <caption className="sr-only">Demandes de validations en attente</caption>
        <thead>
          <tr>
            <th className="px-2 py-1">Module</th>
            <th className="px-2 py-1">Action</th>
            <th className="px-2 py-1">Statut</th>
            {isAdmin && <th className="px-2 py-1"></th>}
          </tr>
        </thead>
        <tbody>
          {items.map(v => (
            <tr key={v.id} className="border-t">
              <td className="px-2 py-1">{v.module}</td>
              <td className="px-2 py-1">{v.action}</td>
              <td className="px-2 py-1">{v.status}</td>
              {isAdmin && (
                <td className="px-2 py-1 space-x-1 text-right">
                  <Button size="sm" onClick={() => handleUpdate(v.id, 'approved')}>
                    OK
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleUpdate(v.id, 'rejected')}>
                    Refus
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
