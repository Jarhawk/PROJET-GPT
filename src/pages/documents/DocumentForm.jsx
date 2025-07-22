// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";

export default function DocumentForm({ onUploaded, entiteType = "", entiteId = null, categories = [] }) {
  const [file, setFile] = useState(null);
  const [titre, setTitre] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [categorie, setCategorie] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    await onUploaded?.(file, {
      titre,
      commentaire,
      categorie,
      entite_liee_type: entiteType,
      entite_liee_id: entiteId,
    });
    setFile(null);
    setTitre("");
    setCommentaire("");
    setCategorie("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm mb-1">Fichier *</label>
      <Input
        type="file"
        onChange={e => setFile(e.target.files?.[0] || null)}
        required
      />
      <label className="block text-sm mb-1">Titre</label>
      <Input
        value={titre}
        onChange={e => setTitre(e.target.value)}
        placeholder="Titre"
      />
      <label className="block text-sm mb-1">Commentaire</label>
      <textarea
        className="input w-full"
        placeholder="Commentaire"
        value={commentaire}
        onChange={e => setCommentaire(e.target.value)}
      />
      <label className="block text-sm mb-1">Catégorie</label>
      <select
        className="input w-full"
        value={categorie}
        onChange={e => setCategorie(e.target.value)}
      >
        <option value="">Catégorie</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <PrimaryButton type="submit" className="mt-2">Uploader</PrimaryButton>
    </form>
  );
}
