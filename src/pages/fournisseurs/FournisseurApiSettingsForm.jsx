import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function FournisseurApiSettingsForm({ fournisseur_id }) {
  const { mama_id } = useAuth();
  const [config, setConfig] = useState({
    url: "",
    type_api: "rest",
    token: "",
    format_facture: "json",
    actif: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mama_id || !fournisseur_id) return;
    supabase
      .from("fournisseurs_api_config")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("fournisseur_id", fournisseur_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setConfig(c => ({ ...c, ...data }));
        setLoading(false);
      });
  }, [mama_id, fournisseur_id]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setConfig(c => ({ ...c, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!mama_id || !fournisseur_id || saving) return;
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from("fournisseurs_api_config")
        .upsert([{ ...config, fournisseur_id, mama_id }], { onConflict: "fournisseur_id" })
        .select()
        .single();
      if (error) throw error;
      toast.success("Configuration sauvegardée");
      setConfig(data);
    } catch (err) {
      toast.error(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 text-sm">
      <div>
        <label className="block font-medium mb-1">URL API</label>
        <input
          className="input input-bordered w-full"
          name="url"
          value={config.url || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Type</label>
        <select
          className="input input-bordered w-full"
          name="type_api"
          value={config.type_api || "rest"}
          onChange={handleChange}
        >
          <option value="rest">REST</option>
          <option value="edi">EDI</option>
          <option value="ftp">FTP</option>
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Token / Credentials</label>
        <input
          className="input input-bordered w-full"
          name="token"
          value={config.token || ""}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Format factures</label>
        <select
          className="input input-bordered w-full"
          name="format_facture"
          value={config.format_facture || "json"}
          onChange={handleChange}
        >
          <option value="pdf">PDF</option>
          <option value="xml">XML</option>
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>
      </div>
      <label className="block">
        <input
          type="checkbox"
          name="actif"
          checked={!!config.actif}
          onChange={handleChange}
          className="mr-2"
        />
        Actif
      </label>
      <Button type="submit" disabled={saving} className="mt-2">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
