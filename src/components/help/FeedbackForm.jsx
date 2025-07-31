// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import ModalGlass from "@/components/ui/ModalGlass";
import { useFeedback } from "@/hooks/useFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
        <h3 className="text-lg font-semibold mb-4">Besoin d'aide ?</h3>
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
          <textarea
            id="message"
            className="w-full p-2 rounded-lg border border-white/20 bg-white/10 dark:bg-[#202638]/50 backdrop-blur text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/70 focus:outline-none h-24"
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
            <Button type="submit" disabled={sending} className="flex items-center gap-2">
              {sending && <span className="loader-glass" />}Envoyer
            </Button>
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

