import { useEffect, useState } from "react";
// ✅ Vérifié
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import useMamaSettings from "@/hooks/useMamaSettings";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";
import { useAuth } from "@/context/AuthContext";

export default function MamaSettingsForm() {
  const { mama_id } = useAuth();
  const { settings, fetchMamaSettings, updateMamaSettings } = useMamaSettings();
  const [form, setForm] = useState(settings);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMamaSettings();
  }, [fetchMamaSettings]);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let fields = { ...form };
    try {
      if (logoFile) {
        if (form.logo_url) {
          await deleteFile(
            "mamastock-branding",
            pathFromUrl(form.logo_url)
          );
        }
        const url = await uploadFile(
          "mamastock-branding",
          logoFile,
          `mama_${mama_id}`
        );
        fields.logo_url = url;
      }
      await updateMamaSettings(fields);
      toast.success("Paramètres enregistrés");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <Toaster position="top-right" />
      <div>
        <label className="block text-sm mb-1">Logo</label>
        {form.logo_url && (
          <img src={form.logo_url} alt="logo" className="h-16 mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files[0])}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Couleur principale</label>
        <input
          type="color"
          name="primary_color"
          value={form.primary_color || "#bfa14d"}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Email expéditeur</label>
        <input
          className="input w-full"
          name="email_envoi"
          value={form.email_envoi || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Email alertes</label>
        <input
          className="input w-full"
          name="email_alertes"
          value={form.email_alertes || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Mode sombre</label>
        <input
          type="checkbox"
          name="dark_mode"
          checked={!!form.dark_mode}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">RGPD</label>
        <textarea
          className="input w-full h-32"
          name="rgpd_text"
          value={form.rgpd_text || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Mentions légales</label>
        <textarea
          className="input w-full h-32"
          name="mentions_legales"
          value={form.mentions_legales || ""}
          onChange={handleChange}
        />
      </div>
      <div className="flex gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
