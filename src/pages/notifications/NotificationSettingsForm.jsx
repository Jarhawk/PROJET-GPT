// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import useNotifications from "@/hooks/useNotifications";
import { Toaster, toast } from "react-hot-toast";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

export default function NotificationSettingsForm() {
  const { fetchPreferences, updatePreferences } = useNotifications();
  const [prefs, setPrefs] = useState({
    email_enabled: true,
    webhook_enabled: false,
    webhook_url: "",
    webhook_token: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences().then((data) => {
      if (data) setPrefs((p) => ({ ...p, ...data }));
      setLoading(false);
    });
  }, [fetchPreferences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const { error } = await updatePreferences(prefs);
      if (error) throw error;
      toast.success("Préférences mises à jour");
    } catch (err) {
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <GlassCard title="Paramètres notifications" className="p-6 text-sm max-w-md">
      <Toaster position="top-right" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <input
            type="checkbox"
            checked={prefs.email_enabled}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, email_enabled: e.target.checked }))
            }
            className="mr-2"
          />
          Recevoir des e-mails
        </label>
        <label className="block">
          <input
            type="checkbox"
            checked={prefs.webhook_enabled}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, webhook_enabled: e.target.checked }))
            }
            className="mr-2"
          />
          Activer les webhooks
        </label>
        {prefs.webhook_enabled && (
          <>
            <Input
              className="w-full"
              placeholder="Webhook URL"
              value={prefs.webhook_url || ""}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, webhook_url: e.target.value }))
              }
            />
            <Input
              className="w-full"
              placeholder="Webhook token"
              value={prefs.webhook_token || ""}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, webhook_token: e.target.value }))
              }
            />
          </>
        )}
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </PrimaryButton>
      </form>
    </GlassCard>
  );
}
