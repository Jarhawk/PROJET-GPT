import { useState, useEffect } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";

export default function FournisseurForm({
  initialData = null,
  onSave,
  onCancel,
}) {
  const isEdit = !!initialData;
  const { addSupplier, updateSupplier } = useSuppliers();
  const { claims } = useAuth();

  const [form, setForm] = useState({
    nom: "",
    ville: "",
    email: "",
    telephone: "",
    actif: true,
  });
  // Contacts multiples
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ nom: "", email: "", telephone: "" });
  const [loading, setLoading] = useState(false);

  // Pré-remplir pour édition
  useEffect(() => {
    if (initialData) {
      setForm({
        nom: initialData.nom || "",
        ville: initialData.ville || "",
        email: initialData.email || "",
        telephone: initialData.telephone || "",
        actif: initialData.actif ?? true,
      });
      // Charger les contacts si édition
      supabase
        .from("fournisseur_contacts")
        .select("*")
        .eq("fournisseur_id", initialData.id)
        .eq("mama_id", claims?.mama_id)
        .then(({ data }) => setContacts(data || []));
    }
  }, [initialData, claims?.mama_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gestion contacts
  const handleAddContact = async () => {
    if (!newContact.nom || !newContact.email) return;
    if (!isEdit) {
      // Pour un nouveau fournisseur, ajout local seulement
      setContacts((prev) => [...prev, { ...newContact }]);
      setNewContact({ nom: "", email: "", telephone: "" });
      return;
    }
    // Si édition, ajout en base directe
    const { error, data } = await supabase
      .from("fournisseur_contacts")
      .insert([{ ...newContact, fournisseur_id: initialData.id, mama_id: claims.mama_id }])
      .select()
      .single();
    if (error) {
      toast.error("Erreur ajout contact.");
    } else {
      toast.success("Contact ajouté !");
      setContacts((prev) => [...prev, data]);
      setNewContact({ nom: "", email: "", telephone: "" });
    }
  };

  const handleDeleteContact = async (cId, idx) => {
    if (!isEdit) {
      // Nouveau fournisseur, suppression locale
      setContacts((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    // Suppression en base
    const { error } = await supabase
      .from("fournisseur_contacts")
      .delete()
      .eq("id", cId)
      .eq("mama_id", claims.mama_id);
    if (error) {
      toast.error("Erreur suppression contact.");
    } else {
      toast.success("Contact supprimé.");
      setContacts((prev) => prev.filter((c) => c.id !== cId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!form.nom) {
      toast.error("Le nom est obligatoire !");
      setLoading(false);
      return;
    }

    let result;
    if (isEdit) {
      result = await updateSupplier(initialData.id, form);
      if (result.error) {
        toast.error("Erreur modification : " + result.error);
        setLoading(false);
        return;
      }
    } else {
      // Création : ajouter le fournisseur, puis les contacts
      result = await addSupplier(form);
      if (result.error) {
        toast.error("Erreur création : " + result.error);
        setLoading(false);
        return;
      }
      // Ajout contacts liés au nouveau fournisseur
      const supplier_id = result.data.id;
      if (contacts.length > 0) {
        await supabase.from("fournisseur_contacts").insert(
          contacts.map((c) => ({
            ...c,
            fournisseur_id: supplier_id,
            mama_id: claims.mama_id,
          }))
        );
      }
    }
    toast.success(isEdit ? "Fournisseur modifié !" : "Fournisseur créé !");
    setLoading(false);
    if (onSave) onSave();
  };

  return (
    <form
      className="bg-white shadow rounded-xl p-6 flex flex-col gap-4"
      onSubmit={handleSubmit}
    >
      <Toaster />
      <h2 className="text-xl font-bold text-mamastock-gold mb-2">
        {isEdit ? "Modifier le fournisseur" : "Nouveau fournisseur"}
      </h2>
      <label>
        Nom *
        <input
          className="input input-bordered w-full"
          name="nom"
          value={form.nom}
          onChange={handleChange}
          required
          autoFocus
        />
      </label>
      <label>
        Ville
        <input
          className="input input-bordered w-full"
          name="ville"
          value={form.ville}
          onChange={handleChange}
        />
      </label>
      <label>
        Email
        <input
          className="input input-bordered w-full"
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
        />
      </label>
      <label>
        Téléphone
        <input
          className="input input-bordered w-full"
          name="telephone"
          value={form.telephone}
          onChange={handleChange}
        />
      </label>
      <label>
        Statut
        <select
          className="select select-bordered w-full"
          name="actif"
          value={form.actif ? "true" : "false"}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, actif: e.target.value === "true" }))
          }
        >
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
      </label>

      {/* Contacts multiples */}
      <div className="bg-gray-50 border rounded-xl p-4 mb-4">
        <h3 className="font-bold text-mamastock-gold mb-2">
          Contacts associés
        </h3>
        <table className="min-w-full table-auto mb-2">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Email</th>
              <th className="px-2 py-1">Téléphone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-center text-gray-500">
                  Aucun contact enregistré.
                </td>
              </tr>
            )}
            {contacts.map((c, idx) => (
              <tr key={c.id || idx}>
                <td className="px-2 py-1">{c.nom}</td>
                <td className="px-2 py-1">{c.email}</td>
                <td className="px-2 py-1">{c.telephone}</td>
                <td className="px-2 py-1">
                  <button
                    className="btn btn-xs bg-red-500 text-white"
                    type="button"
                    onClick={() => handleDeleteContact(c.id, idx)}
                  >
                    Suppr
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td>
                <input
                  className="input input-bordered w-full"
                  placeholder="Nom"
                  value={newContact.nom}
                  onChange={e =>
                    setNewContact(nc => ({ ...nc, nom: e.target.value }))
                  }
                />
              </td>
              <td>
                <input
                  className="input input-bordered w-full"
                  placeholder="Email"
                  type="email"
                  value={newContact.email}
                  onChange={e =>
                    setNewContact(nc => ({ ...nc, email: e.target.value }))
                  }
                />
              </td>
              <td>
                <input
                  className="input input-bordered w-full"
                  placeholder="Téléphone"
                  value={newContact.telephone}
                  onChange={e =>
                    setNewContact(nc => ({ ...nc, telephone: e.target.value }))
                  }
                />
              </td>
              <td>
                <button
                  className="btn btn-xs"
                  type="button"
                  onClick={handleAddContact}
                >
                  Ajouter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn bg-mamastock-gold text-white"
          disabled={loading}
        >
          {loading ? "Sauvegarde..." : isEdit ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </form>
  );
}
