// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/select";

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
    <GlassCard title="Ajouter un document">
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
        className="w-full px-4 py-2 font-semibold text-white placeholder-white/50 bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        placeholder="Commentaire"
        value={commentaire}
        onChange={e => setCommentaire(e.target.value)}
      />
      <label className="block text-sm mb-1">Catégorie</label>
      <Select
        className="w-full"
        value={categorie}
        onChange={e => setCategorie(e.target.value)}
      >
        <option value="">Catégorie</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <PrimaryButton type="submit" className="mt-2">Uploader</PrimaryButton>
      </form>
    </GlassCard>
  );
}
