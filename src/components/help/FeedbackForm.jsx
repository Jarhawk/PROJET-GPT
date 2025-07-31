// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import ModalGlass from "@/components/ui/ModalGlass";
import { useFeedback } from "@/hooks/useFeedback";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import GlassCard from "@/components/ui/GlassCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { toast } from "react-hot-toast";

export default function FeedbackForm({ open, onOpenChange }) {
  const { addFeedback } = useFeedback();
  const [message, setMessage] = useState("");
  const [module, setModule] = useState("");
  const [urgence, setUrgence] = useState("normal");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const payload = { module, message, urgence };
    try {
      const { error } = await addFeedback(payload);
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
      <GlassCard title="Besoin d'aide ?">
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="sr-only" htmlFor="module">Module</label>
          <Input
            id="module"
            placeholder="Module"
            value={module}
            onChange={e => setModule(e.target.value)}
            required
          />
          <label className="sr-only" htmlFor="message">Message</label>
          <Textarea
            id="message"
            className="h-24"
            placeholder="Votre message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
          <label className="sr-only" htmlFor="urgence">Urgence</label>
          <Select
            id="urgence"
            value={urgence}
            onChange={e => setUrgence(e.target.value)}
          >
            <option value="faible">Faible</option>
            <option value="normal">Normal</option>
            <option value="elevee">Élevée</option>
          </Select>
          <div className="flex gap-2 pt-2">
            <PrimaryButton type="submit" disabled={sending} className="flex items-center gap-2">
              {sending && <span className="loader-glass" />}Envoyer
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => onOpenChange(false)}>
              Annuler
            </SecondaryButton>
          </div>
        </form>
      </GlassCard>
    </ModalGlass>
  );
}

