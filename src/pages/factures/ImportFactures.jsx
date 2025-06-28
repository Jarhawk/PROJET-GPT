import { useState } from "react";
import { useInvoiceImport } from "@/hooks/useInvoiceImport";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster, toast } from "react-hot-toast";

export default function ImportFactures() {
  const { importFromFile, loading, error } = useInvoiceImport();
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Sélectionne un fichier à importer");
    const id = await importFromFile(file);
    if (id) toast.success("Facture importée !");
    else toast.error("Echec de l'import");
  };

  return (
    <div className="p-8 container mx-auto space-y-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Import e-facture</h1>
      <GlassCard>
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <input
            type="file"
            accept="application/json,application/xml"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <Button type="submit" disabled={loading}>Importer</Button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </GlassCard>
    </div>
  );
}
