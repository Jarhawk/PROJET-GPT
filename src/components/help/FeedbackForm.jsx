import { useState } from "react";
import ModalGlass from "@/components/ui/ModalGlass";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

export default function FeedbackForm({ open, onOpenChange }) {
  const { user_id, mama_id } = useAuth();
  const [message, setMessage] = useState("");
  const [module, setModule] = useState("");
  const [urgence, setUrgence] = useState("normal");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const payload = { user_id, mama_id, module, message, urgence };
    try {
      const { error } = await supabase.from("feedback").insert([payload]);
      if (error) throw error;
      toast.success("Message envoyé !");
      setMessage("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  }

  return (
    <ModalGlass open={open} onClose={() => onOpenChange(false)}>
        <h3 className="text-lg font-semibold mb-4">Besoin d'aide ?</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            className="input input-bordered w-full"
            placeholder="Module"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            required
          />
          <textarea
            className="input input-bordered w-full h-24"
            placeholder="Votre message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <select
            className="input input-bordered w-full"
            value={urgence}
            onChange={(e) => setUrgence(e.target.value)}
          >
            <option value="faible">Faible</option>
            <option value="normal">Normal</option>
            <option value="elevee">Élevée</option>
          </select>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={sending}>Envoyer</Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border border-white"
            >
              Annuler
            </Button>
          </div>
        </form>
    </ModalGlass>
  );
}

