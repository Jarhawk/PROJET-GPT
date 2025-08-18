// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import SmartDialog, {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/SmartDialog";

export default function DocumentPreview({ url, type = "", open, onClose }) {
  const isPdf = type.includes("pdf") || url?.toLowerCase().endsWith(".pdf");
  return (
    <DialogRoot open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent>
        <DialogTitle>Aperçu document</DialogTitle>
        <DialogDescription className="sr-only">
          Prévisualisation du document
        </DialogDescription>
        {isPdf ? (
          <iframe src={url} className="w-full h-[80vh] rounded-lg" />
        ) : (
          <img src={url} alt="Aperçu" className="max-h-[80vh] mx-auto" />
        )}
      </DialogContent>
    </DialogRoot>
  );
}
