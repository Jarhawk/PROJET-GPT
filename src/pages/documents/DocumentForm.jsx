// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";

export default function DocumentForm({ onUploaded }) {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    await onUploaded?.(file);
    setFile(null);
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
        <PrimaryButton type="submit" className="mt-2">Uploader</PrimaryButton>
      </form>
    </GlassCard>
  );
}
