// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useState, useEffect } from "react";

import { useAuth } from '@/hooks/useAuth';
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import GlassCard from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

export default function InviteUser({ onClose, onInvited }) {
  const { role, mama_id: myMama, user_id } = useAuth();
  const [mamas, setMamas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [values, setValues] = useState({
    email: "",
    mama_id: "",
    role: ""
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user_id) return;

      if (role === "superadmin") {
        const { data: mData } = await supabase.
        from("mamas").
        select("id, nom, ville").
        order("nom");
        setMamas(mData || []);
      } else if (myMama) {
        const { data: mData } = await supabase.
        from("mamas").
        select("id, nom, ville").
        eq("id", myMama).
        maybeSingle();
        setMamas(mData ? [mData] : []);
      }

      let query = supabase.from("roles").select("*");
      if (role !== "superadmin") query = query.eq("mama_id", myMama);
      query = query.eq("actif", true);
      const { data: rData } = await query.order("nom", { ascending: true });
      setRoles(rData || []);
    }

    fetchData();
  }, [role, user_id, myMama]);

  const handleChange = (e) =>
  setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const handleInvite = async (e) => {
    e.preventDefault();
    setSending(true);

    // Validation
    if (!values.email || !values.mama_id || !values.role) {
      toast.error("Tous les champs sont obligatoires !");
      setSending(false);
      return;
    }

    // Empêche doublon email
    const { data: existingUser } = await supabase.
    from("utilisateurs").
    select("id").
    eq("email", values.email).
    maybeSingle();

    if (existingUser) {
      toast.error("Cet email existe déjà.");
      setSending(false);
      return;
    }

    const { error } = await supabase.
    from("utilisateurs").
    insert([
    {
      email: values.email,
      mama_id: values.mama_id,
      role: values.role,
      actif: true,
      invite_pending: true
    }]
    );

    if (!error) {
      // Appel Edge Function cloud Supabase
      await fetch("https://jhpfdeolleprmvtchoxt.supabase.co/functions/v1/send-invite", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          mama_nom: mamas.find((m) => m.id === values.mama_id)?.nom || ""
        }),
        headers: { "Content-Type": "application/json" }
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
    <GlassCard title="Inviter un utilisateur">
      <form className="space-y-3" onSubmit={handleInvite}>
              <div>
        <label>Email</label>
        <Input
            className="w-full"
            name="email"
            type="email"
            required
            value={values.email}
            onChange={handleChange} />

      </div>
      <div>
        <label>Établissement (MAMA)</label>
        <select
            className="input w-full"
            name="mama_id"
            required
            value={values.mama_id}
            onChange={handleChange}>

          <option value="">Sélectionner…</option>
          {mamas.map((m) =>
            <option key={m.id} value={m.id}>
              {m.nom} ({m.ville})
            </option>
            )}
        </select>
      </div>
      <div>
        <label>Rôle</label>
        <select
            className="input w-full"
            name="role"
            required
            value={values.role}
            onChange={handleChange}>

          <option value="">Sélectionner…</option>
          {roles.map((r) =>
            <option key={r.nom} value={r.nom}>
              {r.nom}
            </option>
            )}
        </select>
      </div>
        <div className="flex gap-4 mt-4">
          <PrimaryButton type="submit" disabled={sending}>
            {sending ? "Envoi…" : "Envoyer l'invitation"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose}>
            Annuler
          </SecondaryButton>
        </div>
      </form>
    </GlassCard>);

}