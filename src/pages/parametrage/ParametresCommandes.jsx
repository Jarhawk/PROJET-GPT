// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ParametresCommandes() {
  const { mama_id } = useAuth();
  const [form, setForm] = useState({
    adresse_livraison: "",
    mentions_haut: "",
    mentions_bas: "",
    logo: "",
    footer_pdf: "",
  });

  useEffect(() => {
    if (!mama_id) return;
    supabase
      .from("parametres_commandes")
      .select("*")
      .eq("mama_id", mama_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm({
          adresse_livraison: data.adresse_livraison || "",
          mentions_haut: data.mentions_haut || "",
          mentions_bas: data.mentions_bas || "",
          logo: data.logo || "",
          footer_pdf: data.footer_pdf || "",
        });
      });
  }, [mama_id]);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!mama_id) return;
    const { error } = await supabase
      .from("parametres_commandes")
      .upsert({ ...form, mama_id });
    if (error) toast.error(error.message);
    else toast.success("Paramètres enregistrés");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label>Adresse de livraison</label>
        <input
          aria-label="Adresse de livraison"
          className="input"
          value={form.adresse_livraison}
          onChange={e => handleChange("adresse_livraison", e.target.value)}
        />
      </div>
      <div>
        <label>Mentions PDF haut</label>
        <textarea
          aria-label="Mentions PDF haut"
          className="input"
          value={form.mentions_haut}
          onChange={e => handleChange("mentions_haut", e.target.value)}
        />
      </div>
      <div>
        <label>Mentions PDF bas</label>
        <textarea
          aria-label="Mentions PDF bas"
          className="input"
          value={form.mentions_bas}
          onChange={e => handleChange("mentions_bas", e.target.value)}
        />
      </div>
      <div>
        <label>Logo</label>
        <input
          aria-label="Logo"
          className="input"
          value={form.logo}
          onChange={e => handleChange("logo", e.target.value)}
        />
      </div>
      <div>
        <label>Footer PDF</label>
        <input
          aria-label="Footer PDF"
          className="input"
          value={form.footer_pdf}
          onChange={e => handleChange("footer_pdf", e.target.value)}
        />
      </div>
      <button type="submit">Enregistrer</button>
    </form>
  );
}
