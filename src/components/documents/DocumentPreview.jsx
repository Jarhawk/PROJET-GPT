// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import SmartDialog from "@/components/ui/SmartDialog";

export default function DocumentPreview({ url, type = "", open, onClose }) {
  const isPdf = type.includes("pdf") || url?.toLowerCase().endsWith(".pdf");
  return (
    <SmartDialog
      open={open}
      onClose={onClose}
      title="Aperçu document"
      description="Prévisualisation du document"
    >
      {isPdf ? (
        <iframe src={url} className="w-full h-[80vh] rounded-lg" />
      ) : (
        <img src={url} alt="Aperçu" className="max-h-[80vh] mx-auto" />
      )}
    </SmartDialog>
  );
}
