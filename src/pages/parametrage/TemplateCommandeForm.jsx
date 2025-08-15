// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import supabase from '@/lib/supabaseClient';
import { useTemplatesCommandes } from "@/hooks/useTemplatesCommandes";
import { Button } from "@/components/ui/button";

export default function TemplateCommandeForm({ template = {}, onClose, fournisseurs = [] }) {
  const { createTemplate, updateTemplate } = useTemplatesCommandes();
  const [nom, setNom] = useState(template.nom || "");
  const [fournisseurId, setFournisseurId] = useState(template.fournisseur_id || "");
  const [logoUrl, setLogoUrl] = useState(template.logo_url || "");
  const [entete, setEntete] = useState(template.entete || "");
  const [pied, setPied] = useState(template.pied_page || "");
  const [adresse, setAdresse] = useState(template.adresse_livraison || "");
  const [contactNom, setContactNom] = useState(template.contact_nom || "");
  const [contactTel, setContactTel] = useState(template.contact_tel || "");
  const [contactEmail, setContactEmail] = useState(template.contact_email || "");
  const [conditions, setConditions] = useState(template.conditions_generales || "");
  const [champs, setChamps] = useState(
    template.champs_visibles || { ref_commande: true, date_livraison: true }
  );
  const [actif, setActif] = useState(template.actif ?? true);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `templates/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("public").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("public").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    }
  };

  const toggleChamp = (champ) => {
    setChamps((prev) => ({ ...prev, [champ]: !prev[champ] }));
  };

  const handleSubmit = async () => {
    const payload = {
      nom,
      fournisseur_id: fournisseurId || null,
      logo_url: logoUrl,
      entete,
      pied_page: pied,
      adresse_livraison: adresse,
      contact_nom: contactNom,
      contact_tel: contactTel,
      contact_email: contactEmail,
      conditions_generales: conditions,
      champs_visibles: champs,
      actif,
    };
    if (template.id) await updateTemplate(template.id, payload);
    else await createTemplate(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto space-y-3">
        <h2 className="text-lg font-bold">
          {template.id ? "Modifier" : "Créer"} un template
        </h2>

        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input className="w-full border p-1" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Fournisseur</label>
          <select
            className="w-full border p-1"
            value={fournisseurId}
            onChange={(e) => setFournisseurId(e.target.value)}
          >
            <option value="">Générique</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Logo</label>
          <input type="file" onChange={handleLogoUpload} className="mb-1" />
          {logoUrl && <img src={logoUrl} alt="logo" className="h-16" />}
        </div>

        <div>
          <label className="block text-sm font-medium">En-tête</label>
          <textarea className="w-full border p-1" value={entete} onChange={(e) => setEntete(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Pied de page</label>
          <textarea className="w-full border p-1" value={pied} onChange={(e) => setPied(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Adresse de livraison</label>
          <textarea className="w-full border p-1" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium">Contact nom</label>
            <input className="w-full border p-1" value={contactNom} onChange={(e) => setContactNom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Contact tel</label>
            <input className="w-full border p-1" value={contactTel} onChange={(e) => setContactTel(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Contact email</label>
            <input className="w-full border p-1" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Conditions générales</label>
          <textarea
            className="w-full border p-1"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Champs visibles</label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.keys(champs).map((champ) => (
              <label key={champ} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={champs[champ]}
                  onChange={() => toggleChamp(champ)}
                />
                {champ}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
          <span>Actif</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}

