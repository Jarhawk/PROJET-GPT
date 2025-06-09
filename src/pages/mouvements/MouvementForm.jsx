import { useState } from "react";
import { useMouvements } from "@/hooks/useMouvements";
import { useProducts } from "@/hooks/useProducts";

export default function MouvementForm() {
  const { createMouvement } = useMouvements();
  const { data: products, loading } = useProducts();
  const [form, setForm] = useState({
    produit_id: "",
    zone_source: "",
    zone_destination: "",
    quantite: 0,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await createMouvement(form);
    setForm({
      produit_id: "",
      zone_source: "",
      zone_destination: "",
      quantite: 0,
    });
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-lg font-bold mb-4">Ajouter un mouvement</h2>
      <div className="grid grid-cols-2 gap-4">
        <select
          name="produit_id"
          value={form.produit_id}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">Choisir un produit</option>
          {loading ? (
            <option disabled>Chargement...</option>
          ) : (
            products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))
          )}
        </select>

        <input
          type="text"
          name="zone_source"
          placeholder="Zone source"
          value={form.zone_source}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="zone_destination"
          placeholder="Zone destination"
          value={form.zone_destination}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          name="quantite"
          placeholder="Quantité"
          value={form.quantite}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>
      <button
        onClick={handleSubmit}
        className="mt-4 bg-[var(--mamastock-gold)] text-white px-4 py-2 rounded"
      >
        Enregistrer
      </button>
    </div>
  );
}
