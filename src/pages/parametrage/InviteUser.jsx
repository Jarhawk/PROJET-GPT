import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

export default function InviteUser({ onClose, onInvited }) {
  const [mamas, setMamas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [values, setValues] = useState({
    email: "",
    mama_id: "",
    role: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.from("mamas").select("*").then(({ data }) => setMamas(data || []));
    supabase.from("roles").select("*").then(({ data }) => setRoles(data || []));
  }, []);

  const handleChange = e =>
    setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleInvite = async e => {
    e.preventDefault();
    setSending(true);

    // Validation
    if (!values.email || !values.mama_id || !values.role) {
      toast.error("Tous les champs sont obligatoires !");
      setSending(false);
      return;
    }

    // Empêche doublon email
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", values.email)
      .maybeSingle();

    if (existingUser) {
      toast.error("Cet email existe déjà.");
      setSending(false);
      return;
    }

    const { error } = await supabase
      .from("users")
      .insert([
        {
          email: values.email,
          mama_id: values.mama_id,
          role: values.role,
          actif: true,
          invite_pending: true,
        },
      ]);

    if (!error) {
      // Appel Edge Function cloud Supabase
      await fetch("https://jhpfdeolleprmvtchoxt.supabase.co/functions/v1/send-invite", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          mama_nom: mamas.find(m => m.id === values.mama_id)?.nom || "",
        }),
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Invitation envoyée !");
      if (onInvited) onInvited();
      if (onClose) onClose();
      setValues({ email: "", mama_id: "", role: "" });
    } else {
      toast.error(error.message);
    }
    setSending(false);
  };

  return (
    <form className="space-y-3 p-4" onSubmit={handleInvite}>
      <Toaster />
      <h2 className="font-bold text-lg mb-2">Inviter un utilisateur</h2>
      <div>
        <label htmlFor="invite-email" className="sr-only">Email</label>
        <input
          id="invite-email"
          className="input input-bordered w-full"
          name="email"
          type="email"
          required
          value={values.email}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="invite-mama" className="sr-only">Établissement (MAMA)</label>
        <select
          id="invite-mama"
          className="input input-bordered w-full"
          name="mama_id"
          required
          value={values.mama_id}
          onChange={handleChange}
        >
          <option value="">Sélectionner…</option>
          {mamas.map(m => (
            <option key={m.id} value={m.id}>
              {m.nom} ({m.ville})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="invite-role" className="sr-only">Rôle</label>
        <select
          id="invite-role"
          className="input input-bordered w-full"
          name="role"
          required
          value={values.role}
          onChange={handleChange}
        >
          <option value="">Sélectionner…</option>
          {roles.map(r => (
            <option key={r.nom} value={r.nom}>
              {r.nom}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-4 mt-4">
        <Button type="submit" disabled={sending}>
          {sending ? "Envoi…" : "Envoyer l'invitation"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
