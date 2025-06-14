import { useMama } from "@/hooks/useMama";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";

export default function ParamMama() {
  const { mama, fetchMama, updateMama } = useMama();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchMama(); }, []);
  useEffect(() => { setForm(mama || {}); }, [mama]);

  const handleSubmit = async e => {
    e.preventDefault();
    await updateMama(form);
    setEdit(false);
    toast.success("Établissement mis à jour !");
  };

  return (
    <div>
      <Toaster position="top-right" />
      <h2 className="font-bold text-xl mb-4">Établissement</h2>
      {!edit ? (
        <div>
          <div><b>Nom :</b> {mama?.nom}</div>
          <div><b>Email :</b> {mama?.email}</div>
          <div><b>Téléphone :</b> {mama?.telephone}</div>
          <div><b>Logo :</b> {mama?.logo ? <img src={mama.logo} alt="logo" className="h-8" /> : "-"}</div>
          <Button className="mt-4" onClick={() => setEdit(true)}>Modifier</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input className="input mb-2" value={form.nom || ""} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom" required />
          <input className="input mb-2" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" />
          <input className="input mb-2" value={form.telephone || ""} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="Téléphone" />
          {/* Ajout d'un upload logo possible ici */}
          <Button type="submit">Valider</Button>
          <Button variant="outline" type="button" className="ml-2" onClick={() => setEdit(false)}>Annuler</Button>
        </form>
      )}
    </div>
  );
}
